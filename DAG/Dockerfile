FROM apache/airflow:2.5.1

# Remove this line if you don't have a requirements.txt
COPY requirements.txt .
COPY ../.env .

# Switch to root to install system dependencies
USER root
RUN apt-get update && apt-get install -y curl build-essential

# Switch to the airflow user so that rustup is installed in its home directory
USER airflow
# Set the PATH to include the Cargo bin directory (assumed to be in /home/airflow/.cargo/bin)
ENV PATH="/home/airflow/.cargo/bin:${PATH}"
# Install rustup and set the default toolchain to stable
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y && \
    rustup default stable && \
    cargo --version

RUN pip install -r requirements.txt
