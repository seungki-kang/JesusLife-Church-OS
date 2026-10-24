FROM postgres:16
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/verify
ENV PATH="/opt/verify/bin:$PATH"
WORKDIR /workspace
COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt
COPY . .
ENTRYPOINT ["python", "tools/postgres/run_checks.py"]
