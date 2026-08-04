def predict_job_readiness(tech_score, hr_score, aptitude_score, dsa_solved, resume_score):
    """
    Mock implementation of a Machine Learning readiness predictor (e.g., XGBoost, Random Forest).
    In a real-world scenario, this would load a pre-trained .pkl model and run `.predict()`.
    
    Returns:
        dict: containing the prediction percentage and standard insights.
    """
    
    # Feature weights (Mock ML coefficients)
    w_tech = 0.35
    w_algo = 0.25 # represented by dsa_solved
    w_hr = 0.15
    w_apt = 0.15
    w_res = 0.10
    
    # Normalize DSA solved (assume 50 is 'expert' for this mock model)
    dsa_norm = min(100, (dsa_solved / 50.0) * 100)
    
    # Calculate weighted prediction
    prediction = (
        (tech_score * w_tech) +
        (dsa_norm * w_algo) +
        (hr_score * w_hr) +
        (aptitude_score * w_apt) +
        (resume_score * w_res)
    )
    
    # Cap prediction between 0 and 100
    prediction = max(0, min(100, round(prediction, 1)))
    
    # Generate insights based on the mock prediction boundaries
    if prediction >= 80:
        insight = "High probability of clearing Product-based and Top Tier Service companies."
    elif prediction >= 60:
        insight = "Good chance of clearing standard Service-based companies. Improve DSA for Product companies."
    elif prediction >= 40:
        insight = "Average readiness. Need to focus on Technical rounds and Aptitude."
    else:
        insight = "Low readiness. Recommended to complete the Learning Roadmap before interviewing."

    return {
        "readiness_prediction": prediction,
        "insight": insight
    }
