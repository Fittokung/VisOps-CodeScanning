import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // --- Templates ---
  
  // 1. Node.js
  await prisma.dockerTemplate.upsert({
    where: { stack: 'node' },
    update: {},
    create: {
      stack: 'node',
      content: `
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .
USER node
EXPOSE 3000
CMD ["npm", "start"]
      `
    }
  })

  // 2. Python
  await prisma.dockerTemplate.upsert({
    where: { stack: 'python' },
    update: {},
    create: {
      stack: 'python',
      content: `
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "app.py"]
      `
    }
  })

  // 3. Java
  await prisma.dockerTemplate.upsert({
    where: { stack: 'java' },
    update: {},
    create: {
      stack: 'java',
      content: `
FROM maven:3.8.4-openjdk-17-slim AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
CMD ["java", "-jar", "app.jar"]
      `
    }
  })

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })