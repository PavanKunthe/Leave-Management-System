# Line 1: Start from a pre-built Python image (like starting with a fresh Ubuntu that has Python installed)
FROM python:3.11-slim

# Line 2: Create a folder called /app inside the container and make it the working directory
WORKDIR /app

# Line 3: Copy ONLY requirements.txt first (Docker caches this layer — if requirements don't change, it skips reinstalling)
COPY requirements.txt .

# Line 4: Install all Python packages listed in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Line 5: Now copy ALL your backend code into the container
COPY . .

# Line 6: Tell Docker this container will listen on port 8000
EXPOSE 8000

# Line 7: The command to run when the container starts
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]