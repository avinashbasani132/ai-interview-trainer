import io
from datetime import datetime
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.graphics.shapes import Drawing, Circle, String, Rect
from reportlab.graphics.barcode.qr import QrCodeWidget


# Certificate size in A4 Landscape: 841.89 pt x 595.27 pt (29.7cm x 21cm)
PAGE_WIDTH = 841.89
PAGE_HEIGHT = 595.27

class CertificateService:
    @staticmethod
    def generate_pdf(
        certificate_id: str,
        candidate_name: str,
        interview_type: str,
        overall_score: float,
        completion_date: datetime,
        duration_minutes: int,
        skills_assessed: list,
        verify_url: str,
        mode: str = 'light'
    ) -> io.BytesIO:
        """
        Generates a premium, high-resolution A4 landscape certificate using ReportLab vector drawings.
        Supports both 'light' and 'dark' printable styles.
        """
        buf = io.BytesIO()
        
        # Determine theme colors
        if mode == 'dark':
            bg_color = HexColor('#0f172a')        # Deep Slate
            border_primary = HexColor('#312e81')   # Indigo 900
            border_gold = HexColor('#d97706')      # Amber 600
            text_title = HexColor('#f8fafc')       # Slate 50
            text_body = HexColor('#cbd5e1')        # Slate 300
            text_accent = HexColor('#fbbf24')      # Amber 400
        else:
            bg_color = HexColor('#fafaf9')        # Ivory White / Warm Stone
            border_primary = HexColor('#1e3a8a')   # Royal Navy Blue
            border_gold = HexColor('#b45309')      # Dark Amber / Gold Accent
            text_title = HexColor('#1c1917')       # Dark Charcoal
            text_body = HexColor('#44403c')        # Slate grey
            text_accent = HexColor('#b45309')      # Gold/Amber Accent

        # Background Page Template Callback
        def draw_background(canvas, doc):
            canvas.saveState()
            
            # 1. Fill page background
            canvas.setFillColor(bg_color)
            canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=True, stroke=False)
            
            # 2. Outer thin gold border
            canvas.setStrokeColor(border_gold)
            canvas.setLineWidth(2)
            canvas.rect(15, 15, PAGE_WIDTH - 30, PAGE_HEIGHT - 30, fill=False, stroke=True)
            
            # 3. Inner thick primary color border
            canvas.setStrokeColor(border_primary)
            canvas.setLineWidth(6)
            canvas.rect(22, 22, PAGE_WIDTH - 44, PAGE_HEIGHT - 44, fill=False, stroke=True)
            
            # 4. Thin inner gold border
            canvas.setStrokeColor(border_gold)
            canvas.setLineWidth(1)
            canvas.rect(32, 32, PAGE_WIDTH - 64, PAGE_HEIGHT - 64, fill=False, stroke=True)
            
            # 5. Draw ornamental corner gold pieces
            canvas.setFillColor(border_gold)
            # Top-Left corner decor:
            canvas.rect(32, PAGE_HEIGHT - 42, 10, 10, fill=True, stroke=False)
            canvas.rect(42, PAGE_HEIGHT - 32, 10, 10, fill=True, stroke=False)
            # Top-Right corner decor:
            canvas.rect(PAGE_WIDTH - 42, PAGE_HEIGHT - 42, 10, 10, fill=True, stroke=False)
            canvas.rect(PAGE_WIDTH - 52, PAGE_HEIGHT - 32, 10, 10, fill=True, stroke=False)
            # Bottom-Left corner decor:
            canvas.rect(32, 32, 10, 10, fill=True, stroke=False)
            canvas.rect(42, 42, 10, 10, fill=True, stroke=False)
            # Bottom-Right corner decor:
            canvas.rect(PAGE_WIDTH - 42, 32, 10, 10, fill=True, stroke=False)
            canvas.rect(PAGE_WIDTH - 52, 42, 10, 10, fill=True, stroke=False)
            
            # 6. Draw Official Seal (vector shapes)
            seal_x = 100
            seal_y = 105
            
            # Outer starburst style ring (mocked with circle + text)
            canvas.setFillColor(HexColor('#fbbf24') if mode == 'dark' else HexColor('#f59e0b'))
            canvas.setStrokeColor(border_gold)
            canvas.setLineWidth(2)
            canvas.circle(seal_x, seal_y, 45, fill=True, stroke=True)
            
            # Inner white dashed circle
            canvas.setStrokeColor(bg_color)
            canvas.setLineWidth(1)
            canvas.setDash(2, 2)
            canvas.circle(seal_x, seal_y, 39, fill=False, stroke=True)
            
            # Seal internal text
            canvas.setFillColor(border_primary)
            canvas.setFont("Helvetica-Bold", 8)
            canvas.drawCentredString(seal_x, seal_y + 12, "AI INTERVIEW")
            canvas.drawCentredString(seal_x, seal_y + 2, "TRAINER")
            
            canvas.setFont("Times-Bold", 10)
            canvas.setFillColor(border_gold)
            canvas.drawCentredString(seal_x, seal_y - 12, "★ SEAL ★")
            canvas.setFont("Helvetica-Bold", 6)
            canvas.setFillColor(border_primary)
            canvas.drawCentredString(seal_x, seal_y - 25, "VALIDATED")
            
            # Restore state
            canvas.restoreState()

        # Build document flow
        doc = SimpleDocTemplate(
            buf,
            pagesize=(PAGE_WIDTH, PAGE_HEIGHT),
            leftMargin=55,
            rightMargin=55,
            topMargin=50,
            bottomMargin=45
        )

        styles = getSampleStyleSheet()
        
        # Styles adjustments
        logo_style = ParagraphStyle(
            'LogoStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=border_primary,
            alignment=1, # Center
            spaceAfter=5
        )
        
        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            textColor=border_gold,
            alignment=1,
            spaceAfter=25
        )

        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Normal'],
            fontName='Times-Bold',
            fontSize=26,
            textColor=text_title,
            alignment=1,
            spaceAfter=15
        )

        intro_style = ParagraphStyle(
            'IntroStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=11,
            textColor=text_body,
            alignment=1,
            spaceAfter=10
        )

        name_style = ParagraphStyle(
            'NameStyle',
            parent=styles['Normal'],
            fontName='Times-Bold',
            fontSize=28,
            textColor=text_accent,
            alignment=1,
            spaceAfter=10
        )

        description_style = ParagraphStyle(
            'DescriptionStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=text_body,
            alignment=1,
            spaceAfter=20
        )

        label_style = ParagraphStyle(
            'LabelStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            textColor=border_gold
        )

        value_style = ParagraphStyle(
            'ValueStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            textColor=text_body
        )

        # Flow elements list
        story = []
        
        # App logo header
        story.append(Paragraph("🤖 AI INTERVIEW TRAINER", logo_style))
        story.append(Paragraph("ELEVATING CAREERS THROUGH ARTIFICIAL INTELLIGENCE", subtitle_style))
        story.append(Spacer(1, 10))

        # Certificate title
        story.append(Paragraph("CERTIFICATE OF ACHIEVEMENT", title_style))
        story.append(Spacer(1, 5))
        
        # Presentee text
        story.append(Paragraph("This certificate is proudly presented to", intro_style))
        story.append(Spacer(1, 5))
        story.append(Paragraph(candidate_name, name_style))
        story.append(Spacer(1, 5))
        
        # Success description
        desc_text = (
            f"for successfully completing the structured <b>{interview_type}</b> assessment rounds, "
            f"demonstrating exceptional competency and practical software engineering capabilities, "
            f"securing an overall evaluation score of <b>{overall_score:.1f}%</b>."
        )
        story.append(Paragraph(desc_text, description_style))
        story.append(Spacer(1, 15))

        # ── Grid of Details (Report Table style) ──
        skills_text = ", ".join(skills_assessed)
        if len(skills_text) > 65:
            skills_text = skills_text[:62] + "..."
            
        data = [
            [
                Paragraph("<b>Certificate ID:</b>", label_style), Paragraph(certificate_id, value_style),
                Paragraph("<b>Completed Date:</b>", label_style), Paragraph(completion_date.strftime('%Y-%m-%d'), value_style)
            ],
            [
                Paragraph("<b>Verification URL:</b>", label_style), Paragraph(verify_url.replace("http://", "").replace("https://", ""), value_style),
                Paragraph("<b>Skills Assessed:</b>", label_style), Paragraph(skills_text, value_style)
            ],
            [
                Paragraph("<b>Assessment Type:</b>", label_style), Paragraph(interview_type, value_style),
                Paragraph("<b>Total Duration:</b>", label_style), Paragraph(f"{duration_minutes} Minutes", value_style)
            ]
        ]
        
        t = Table(data, colWidths=[110, 230, 100, 210])
        t.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(t)
        story.append(Spacer(1, 20))

        # ── Signatures & QR Code Footer ──
        # QR Code rendering
        qr_drawing = Drawing(75, 75)
        qr_widget = QrCodeWidget(verify_url)
        bounds = qr_widget.getBounds()
        qr_w = bounds[2] - bounds[0]
        qr_h = bounds[3] - bounds[1]
        qr_drawing.transform = [75.0/qr_w, 0, 0, 75.0/qr_h, 0, 0]
        qr_drawing.add(qr_widget)
        
        # Mock Signature line
        sig_drawing = Drawing(160, 40)
        # Cursive style signature drawing
        sig_drawing.add(Circle(80, 25, 2, fillColor=border_gold, strokeColor=border_gold))
        sig_drawing.add(String(10, 18, "Antigravity AI Team", fontName='Times-BoldItalic', fontSize=15, fillColor=border_primary))
        sig_drawing.add(Rect(10, 5, 140, 1, fillColor=border_gold, strokeColor=border_gold))
        sig_drawing.add(String(20, -5, "AUTHORIZED SIGNATURE", fontName='Helvetica-Bold', fontSize=7, fillColor=border_gold))

        footer_data = [
            [Spacer(1, 1), sig_drawing, qr_drawing]
        ]
        
        # Placing authorized signature and QR Code verification neatly
        footer_table = Table(footer_data, colWidths=[160, 390, 100])
        footer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(footer_table)

        # Build Document with templates
        doc.build(story, onFirstPage=draw_background)
        buf.seek(0)
        return buf
