FROM node:18-bullseye-slim
ENV NODE_ENV=production

# follow openshfit guidelines for supporting arbitrary user IDs
# https://docs.openshift.com/container-platform/4.16/creating_images/guidelines.html#openshift-container-platform-specific-guidelines
RUN mkdir -p /usr/src/app /etc/config && \
    chgrp -R 0 /usr/src/app /etc/config && \
    chmod -R g=u /usr/src/app /etc/config

COPY . /usr/src/app
RUN cd /usr/src/app/component/node_modules/onnxruntime-node && npm run postinstall
RUN cd /usr/src/app/component/node_modules/sharp && npm run clean && node install/libvips && node install/dll-copy && node ../prebuild-install/bin.js

USER 1001
WORKDIR /usr/src/app/component
CMD [ "node", "./node_modules/fastify-cli/cli.js", "start", "-l", "info", "dist/app.js"]