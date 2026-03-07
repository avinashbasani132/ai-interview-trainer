import argparse
import sys
from app import create_app
from waitress import serve

def parse_args():
    """
    Safely parses command-line arguments using argparse.
    Avoids manual sys.argv parsing which is prone to errors and injection.
    """
    parser = argparse.ArgumentParser(description="Secure Flask Application Runner")
    
    # Restrict mode to only defined, safe options using `choices`
    parser.add_argument(
        "--mode", 
        type=str, 
        choices=["dev", "prod"], 
        default="dev",
        help="Run mode: 'dev' for local testing or 'prod' for secure deployment."
    )
    
    # Ensure port is an integer
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to run the application on (default: 8000)."
    )
    
    return parser.parse_args()

def main():
    """
    Main entry point allowing the application to run securely based on cli args.
    """
    args = parse_args()
    
    print(f"[*] Starting secure application in {args.mode.upper()} mode on port {args.port}...")
    
    # Initialize the app using the factory pattern
    app = create_app(config_name=args.mode)
    
    if args.mode == "dev":
        # Safe for development ONLY
        print("[!] Running Flask built-in server (Not for Production).")
        app.run(host="127.0.0.1", port=args.port, debug=True)
    elif args.mode == "prod":
        # Safe for production (Waitress acts as a WSGI server for Windows/Linux)
        print("[*] Running secure WSGI Waitress server.")
        serve(app, host="0.0.0.0", port=args.port)

if __name__ == "__main__":
    main()
