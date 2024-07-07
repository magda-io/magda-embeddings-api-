FROM node:18-bullseye-slim
ENV NODE_ENV production

# follow openshfit guidelines for supporting arbitrary user IDs
# https://docs.openshift.com/container-platform/4.16/creating_images/guidelines.html#openshift-container-platform-specific-guidelines
RUN mkdir -p /usr/src/app /etc/config && \
    chgrp -R 0 /usr/src/app /etc/config && \
    chmod -R g=u /usr/src/app /etc/config

USER 1001

COPY . /usr/src/app
WORKDIR /usr/src/app/component
CMD [ "node", "./node_modules/fastify-cli/cli.js", "start", "-l", "info", "dist/app.js"]