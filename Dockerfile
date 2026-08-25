FROM nikolaik/python-nodejs:python3.11-nodejs20

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Ensure qou directory exists and has permissions
RUN mkdir -p public/qou
RUN chmod -R 777 public/qou

EXPOSE 3001

CMD ["npm", "start"]
