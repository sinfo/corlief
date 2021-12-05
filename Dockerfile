FROM node:lts

WORKDIR /app
COPY . .

RUN npm install
RUN npm run gen-keys
ENTRYPOINT ["npm", "run", "production"]
