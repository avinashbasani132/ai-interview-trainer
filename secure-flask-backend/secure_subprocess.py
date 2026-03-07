import subprocess
import logging

# Configure basic logging for debugging and security auditing
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_command_safely(*command_args: str) -> str:
    """
    Safely executes an external system command.
    
    WARNING:
    - Never use `shell=True` when passing any user input to a command.
    - Never pass a single unsanitized string. Always pass the command
      and its arguments as separate items in a tuple/list (e.g., *command_args).
    
    Args:
        *command_args: Variadic string arguments representing the command and its args.
                       Example: run_command_safely("ls", "-la")
    
    Returns:
        The standard output of the command if successful.
        
    Raises:
        RuntimeError: If the command execution fails or returns a non-zero exit code.
    """
    try:
        # check=True forces a CalledProcessError if the command fails
        # text=True decodes the byte response into a readable string
        # shell=False (default) prevents shell injection attacks
        result = subprocess.run(
            command_args, 
            check=True, 
            capture_output=True, 
            text=True
        )
        logger.info(f"Command executed successfully: {command_args}")
        return result.stdout.strip()
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed with exit code {e.returncode}.")
        logger.error(f"Error Output: {e.stderr}")
        raise RuntimeError("Failed to execute external command safely.") from e
        
    except FileNotFoundError as e:
        logger.error(f"Command not found: {command_args[0]}")
        raise RuntimeError("External command executable not found.") from e

# Example safe usage (Do not use this with untrusted user input directly!)
# output = run_command_safely("echo", "Hello from a safe subprocess!")
# print(output)
