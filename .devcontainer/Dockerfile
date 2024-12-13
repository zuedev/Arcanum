FROM node:22

WORKDIR /app

# install & enable fish shell
RUN apt-get update && apt-get install -y fish
RUN chsh -s /usr/bin/fish

# print versions
RUN node --version
