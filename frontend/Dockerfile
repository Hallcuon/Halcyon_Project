# Use a Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application's code
COPY . .

# Make port 5173 available to the world outside this container
EXPOSE 5173

# Run the app when the container launches
CMD ["npm", "run", "dev", "--", "--host"]