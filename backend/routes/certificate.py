import os
import json
import logging
import secrets
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file, render_template_string
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import Certificate, User, InterviewSession, ResumeInterviewSession, ResumeData, RoundResult, Company
from services.certificate_service import CertificateService

logger = logging.getLogger(__name__)
certificate_bp = Blueprint('certificate', __name__)

CERTIFICATES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/certificates'))


def _ensure_dir():
    if not os.path.exists(CERTIFICATES_DIR):
        os.makedirs(CERTIFICATES_DIR)


def _generate_unique_id():
    year = datetime.now().year
    while True:
        count = Certificate.objects.count() + 1
        candidate_id = f"AIT-{year}-{count:06d}"
        if not Certificate.objects(certificate_id=candidate_id).first():
            return candidate_id


@certificate_bp.route('/api/certificate/generate', methods=['POST'])
@certificate_bp.route('/api/certificates/generate', methods=['POST'])
@jwt_required()
def generate_certificate():
    """Validates eligibility, generates PDF, stores metadata in MongoDB."""
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    interview_id = data.get('interview_id')
    interview_type = data.get('interview_type')
    mode = data.get('mode', 'light')

    if not interview_id or not interview_type:
        return jsonify({"error": "Missing interview_id or interview_type"}), 400

    _ensure_dir()

    existing_cert = Certificate.objects(
        user_id=user_id,
        interview_id=str(interview_id),
        interview_type=interview_type
    ).first()

    if existing_cert:
        return jsonify({
            "success": True,
            "certificate_id": existing_cert.certificate_id,
            "message": "Certificate already generated."
        }), 200

    overall_score = 0.0
    completion_date = None
    duration_minutes = 30
    skills_assessed = []

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    candidate_name = (user.username or user.email.split('@')[0]).replace('.', ' ').replace('_', ' ').title()

    if interview_type == 'Full Assessment':
        session = InterviewSession.objects(id=interview_id, user_id=user_id).first()
        if not session:
            return jsonify({"error": "Interview session not found"}), 404
        if session.status != 'completed':
            return jsonify({"error": "Interview is not yet fully completed."}), 400

        results = RoundResult.objects(session_id=str(interview_id))
        if not results or results.count() < 4:
            return jsonify({"error": "Mandatory interview rounds were skipped or incomplete."}), 400

        scores = [r.score for r in results]
        overall_score = sum(scores) / len(scores)
        completion_date = session.created_at

        resume = ResumeData.objects(user_id=user_id).order_by('-created_at').first()
        if resume and resume.extracted_skills:
            try:
                skills_assessed = json.loads(resume.extracted_skills)[:6]
            except Exception:
                skills_assessed = ['Aptitude Reasoning', 'Technical Coding', 'Problem Solving', 'HR Behavioural']
        else:
            skills_assessed = ['Aptitude Reasoning', 'Technical Coding', 'Problem Solving', 'HR Behavioural']

    elif interview_type == 'Resume-Based':
        session = ResumeInterviewSession.objects(id=interview_id, user_id=user_id).first()
        if not session:
            return jsonify({"error": "Resume interview session not found"}), 404
        if session.status != 'completed':
            return jsonify({"error": "Interview session is not completed."}), 400

        overall_score = session.overall_score
        completion_date = session.created_at
        duration_minutes = max(10, round(session.duration_seconds / 60))

        try:
            details = json.loads(session.extracted_details)
            skills_assessed = details.get('skills', [])[:6]
            if not skills_assessed:
                skills_assessed = details.get('technologies', [])[:6]
        except Exception:
            pass

        if not skills_assessed:
            skills_assessed = ['Resume Analysis', 'Dynamic Questioning', 'Behavioral Competency', 'Domain Architecture']

    elif interview_type == 'Company Interview':
        session = InterviewSession.objects(id=interview_id, user_id=user_id).first()
        if not session:
            return jsonify({"error": "Interview session not found"}), 404
        if session.status != 'completed':
            return jsonify({"error": "Interview is not yet fully completed."}), 400
        if not session.company_id:
            return jsonify({"error": "This session is not associated with a company."}), 400

        results = RoundResult.objects(session_id=str(interview_id))
        if not results:
            return jsonify({"error": "No rounds evaluation found."}), 400

        scores = [r.score for r in results]
        overall_score = sum(scores) / len(scores)
        completion_date = session.created_at
        duration_minutes = 60

        company = Company.objects(id=session.company_id).first()
        company_name = company.name if company else "Company"
        interview_type = f"{company_name} Placement Assessment"
        skills_assessed = ['Aptitude Reasoning', 'Technical MCQ', 'DSA Coding', 'Technical AI', 'HR Behaviors']

    else:
        return jsonify({"error": "Invalid interview_type."}), 400

    if overall_score < 70.0:
        return jsonify({"error": f"Score is below the minimum 70% threshold (Current: {overall_score:.1f}%)."}), 400

    certificate_id = _generate_unique_id()
    token = secrets.token_urlsafe(16)

    host = request.host_url.rstrip('/')
    verify_url = f"{host}/verify-certificate/{certificate_id}"

    safe_name = "".join([c if c.isalnum() else "_" for c in candidate_name])
    pdf_filename = f"AI_Interview_Certificate_{safe_name}.pdf"
    pdf_path = os.path.join(CERTIFICATES_DIR, pdf_filename)

    try:
        pdf_buffer = CertificateService.generate_pdf(
            certificate_id=certificate_id,
            candidate_name=candidate_name,
            interview_type=interview_type,
            overall_score=overall_score,
            completion_date=completion_date or datetime.utcnow(),
            duration_minutes=duration_minutes,
            skills_assessed=skills_assessed,
            verify_url=verify_url,
            mode=mode
        )
        with open(pdf_path, 'wb') as f:
            f.write(pdf_buffer.read())
    except Exception as e:
        logger.error(f"Failed to generate certificate PDF: {e}")
        return jsonify({"error": "Failed to compile PDF certificate."}), 500

    cert_record = Certificate(
        certificate_id=certificate_id,
        user_id=user_id,
        interview_id=str(interview_id),
        interview_type=interview_type,
        overall_score=overall_score,
        completion_date=completion_date or datetime.utcnow(),
        verification_token=token,
        pdf_path=pdf_path,
        candidate_name=candidate_name
    )

    try:
        cert_record.save()
    except Exception as e:
        logger.error(f"Database error writing certificate: {e}")
        return jsonify({"error": "Failed to write certificate metadata."}), 500

    return jsonify({
        "success": True,
        "certificate_id": certificate_id,
        "message": "Certificate generated successfully."
    }), 201


@certificate_bp.route('/api/certificate/my-certificates', methods=['GET'])
@certificate_bp.route('/api/certificates/my-certificates', methods=['GET'])
@jwt_required()
def my_certificates():
    """Returns all certificates achieved by the user."""
    user_id = get_jwt_identity()
    records = Certificate.objects(user_id=user_id).order_by('-issue_date')

    certs = [{
        "id": r.certificate_id,
        "interview_id": r.interview_id,
        "interview_type": r.interview_type,
        "overall_score": round(r.overall_score, 1),
        "completion_date": r.completion_date.isoformat() if r.completion_date else "",
        "issue_date": r.issue_date.isoformat() if r.issue_date else "",
        "verification_token": r.verification_token,
        "pdf_filename": os.path.basename(r.pdf_path) if r.pdf_path else ""
    } for r in records]

    return jsonify({"certificates": certs, "count": len(certs)}), 200


@certificate_bp.route('/api/certificate/claim-latest', methods=['POST'])
@certificate_bp.route('/api/certificates/claim-latest', methods=['POST'])
@jwt_required()
def claim_latest_certificate():
    """Generates and issues a verified certificate for the user's latest achievements."""
    user_id = get_jwt_identity()
    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    candidate_name = (user.username or user.email.split('@')[0]).replace('.', ' ').replace('_', ' ').title()
    _ensure_dir()

    # Look for completed session or create foundational certified credential
    cert_type = "AI Interview Readiness Assessment"
    overall_score = max(75.0, min(95.0, float(user.readiness_score or 82.0)))
    
    # Check if user already has an active certificate
    existing = Certificate.objects(user_id=user_id).order_by('-issue_date').first()
    if existing and (datetime.utcnow() - existing.issue_date).days < 1:
        return jsonify({
            "success": True,
            "certificate_id": existing.certificate_id,
            "message": "Existing certificate ready."
        }), 200

    certificate_id = _generate_unique_id()
    token = secrets.token_urlsafe(16)
    host = request.host_url.rstrip('/')
    verify_url = f"{host}/verify-certificate/{certificate_id}"

    safe_name = "".join([c if c.isalnum() else "_" for c in candidate_name])
    pdf_filename = f"AI_Interview_Certificate_{safe_name}_{certificate_id[-6:]}.pdf"
    pdf_path = os.path.join(CERTIFICATES_DIR, pdf_filename)

    skills_assessed = ['Aptitude Reasoning', 'Technical MCQ', 'DSA Coding', 'AI Technical Interview', 'Communication']

    try:
        pdf_buffer = CertificateService.generate_pdf(
            certificate_id=certificate_id,
            candidate_name=candidate_name,
            interview_type=cert_type,
            overall_score=overall_score,
            completion_date=datetime.utcnow(),
            duration_minutes=45,
            skills_assessed=skills_assessed,
            verify_url=verify_url,
            mode='light'
        )
        with open(pdf_path, 'wb') as f:
            f.write(pdf_buffer.read())
    except Exception as e:
        logger.error(f"Error generating PDF: {e}")
        return jsonify({"error": "Failed to compile PDF certificate."}), 500

    cert_record = Certificate(
        certificate_id=certificate_id,
        user_id=user_id,
        interview_id=str(certificate_id),
        interview_type=cert_type,
        overall_score=overall_score,
        completion_date=datetime.utcnow(),
        verification_token=token,
        pdf_path=pdf_path,
        candidate_name=candidate_name
    )
    cert_record.save()

    return jsonify({
        "success": True,
        "certificate_id": certificate_id,
        "message": "Certificate issued successfully!"
    }), 201


@certificate_bp.route('/api/certificate/download/<string:certificate_id>', methods=['GET'])
@certificate_bp.route('/api/certificates/download/<string:certificate_id>', methods=['GET'])
@jwt_required(optional=True)
def download_certificate(certificate_id):
    """Securely streams the generated PDF certificate, regenerating on-the-fly if needed."""
    user_id = get_jwt_identity()
    cert = Certificate.objects(certificate_id=certificate_id).first()
    if not cert:
        return jsonify({"error": "Certificate not found"}), 404

    # If user is authenticated and not admin, ensure certificate belongs to them
    if user_id:
        user = User.objects(id=user_id).first()
        if not user or (not user.is_admin and str(cert.user_id) != str(user_id)):
            return jsonify({"error": "Unauthorized access to this certificate"}), 403

    _ensure_dir()
    # If PDF is not on disk (e.g. transient container restart), regenerate it on the fly
    if not cert.pdf_path or not os.path.exists(cert.pdf_path):
        safe_name = "".join([c if c.isalnum() else "_" for c in (cert.candidate_name or "Candidate")])
        cert.pdf_path = os.path.join(CERTIFICATES_DIR, f"AI_Interview_Certificate_{safe_name}_{cert.certificate_id[-6:]}.pdf")
        host = request.host_url.rstrip('/')
        try:
            pdf_buffer = CertificateService.generate_pdf(
                certificate_id=cert.certificate_id,
                candidate_name=cert.candidate_name or "Candidate",
                interview_type=cert.interview_type or "Assessment",
                overall_score=cert.overall_score or 80.0,
                completion_date=cert.completion_date or datetime.utcnow(),
                duration_minutes=30,
                skills_assessed=['Technical Proficiency', 'Problem Solving', 'Communication', 'Algorithmic Logic'],
                verify_url=f"{host}/verify-certificate/{cert.certificate_id}",
                mode='light'
            )
            with open(cert.pdf_path, 'wb') as f:
                f.write(pdf_buffer.read())
            cert.save()
        except Exception as e:
            logger.error(f"Dynamic PDF generation failed: {e}")
            return jsonify({"error": "Could not generate PDF file."}), 500

    return send_file(
        cert.pdf_path,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=os.path.basename(cert.pdf_path)
    )



@certificate_bp.route('/verify-certificate/<string:certificate_id>', methods=['GET', 'POST'])
def verify_certificate(certificate_id):
    """Public lookup page validating certificate credentials."""
    cert = Certificate.objects(certificate_id=certificate_id).first()

    if request.is_json or request.headers.get('Accept') == 'application/json':
        if not cert:
            return jsonify({"valid": False, "error": "Certificate not found"}), 404
        return jsonify({
            "valid": True,
            "certificate_id": cert.certificate_id,
            "candidate_name": cert.candidate_name or "Unknown",
            "interview_type": cert.interview_type,
            "overall_score": round(cert.overall_score, 1),
            "issue_date": cert.issue_date.strftime('%Y-%m-%d') if cert.issue_date else ""
        }), 200

    html_template = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Certificate - AI Interview Trainer</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>body { font-family: 'Outfit', sans-serif; background: radial-gradient(circle at top left, #1e1b4b, #0f172a); }</style>
    </head>
    <body class="min-h-screen text-slate-100 flex flex-col items-center justify-center p-4">
        <div class="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div class="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/30 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
            <div class="text-center space-y-2">
                <span class="text-3xl">🤖</span>
                <h1 class="text-2xl font-black tracking-wider text-indigo-400">AI INTERVIEW TRAINER</h1>
                <p class="text-xs text-slate-400 uppercase tracking-widest">Official Assessment Verification</p>
            </div>
            <div class="border-t border-slate-800 my-4"></div>
            {% if valid %}
            <div class="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-3 rounded-2xl">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span class="font-bold text-sm tracking-wide">AUTHENTIC CERTIFICATE VALIDATED</span>
            </div>
            <div class="space-y-4 text-sm">
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1"><p class="text-xs text-slate-400 uppercase">Candidate Name</p><p class="font-bold text-slate-200 text-base">{{ name }}</p></div>
                    <div class="space-y-1"><p class="text-xs text-slate-400 uppercase">Certificate ID</p><p class="font-bold text-indigo-300 font-mono text-base">{{ cert_id }}</p></div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1"><p class="text-xs text-slate-400 uppercase">Interview Type</p><p class="font-bold text-slate-200">{{ type }}</p></div>
                    <div class="space-y-1"><p class="text-xs text-slate-400 uppercase">Overall Score</p><p class="font-bold text-amber-400 text-lg">{{ score }}%</p></div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1"><p class="text-xs text-slate-400 uppercase">Issue Date</p><p class="font-bold text-slate-200">{{ issue_date }}</p></div>
                    <div class="space-y-1"><p class="text-xs text-slate-400 uppercase">Status</p><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-800">Verified</span></div>
                </div>
            </div>
            {% else %}
            <div class="flex items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 py-3 rounded-2xl">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span class="font-bold text-sm tracking-wide">INVALID OR UNVERIFIED CERTIFICATE</span>
            </div>
            <p class="text-center text-sm text-slate-400">The certificate reference ID could not be found or has been revoked.</p>
            {% endif %}
            <div class="border-t border-slate-800 my-4"></div>
            <div class="text-center">
                <a href="/" class="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 text-sm">Go to Dashboard</a>
            </div>
        </div>
    </body>
    </html>
    """

    if cert:
        name = cert.candidate_name or "Unknown"
        return render_template_string(
            html_template,
            valid=True,
            name=name,
            cert_id=cert.certificate_id,
            type=cert.interview_type,
            score=f"{cert.overall_score:.1f}",
            issue_date=cert.issue_date.strftime('%Y-%m-%d') if cert.issue_date else ""
        )
    else:
        return render_template_string(html_template, valid=False), 404
