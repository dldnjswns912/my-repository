# 빌드 스테이지
FROM node:20.17.0 AS build

WORKDIR /app

# 최신 npm 설치 (package.json 복사 후 실행)
COPY package.json package-lock.json ./
RUN npm install -g npm@latest

# 패키지 설치
RUN npm install

# 소스 코드 복사
COPY . .

# Vite 빌드 실행
RUN npm run build


# 2단계: 실제 서비스용 Nginx 이미지
FROM nginx:alpine

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/nginx.conf

# 빌드 결과물 복사
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]