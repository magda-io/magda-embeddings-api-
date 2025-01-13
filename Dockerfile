FROM node:18-bullseye-slim
ENV NODE_ENV=production

# follow openshfit guidelines for supporting arbitrary user IDs
# https://docs.openshift.com/container-platform/4.16/creating_images/guidelines.html#openshift-container-platform-specific-guidelines
RUN mkdir -p /usr/src/app /etc/config && \
    chgrp -R 0 /usr/src/app /etc/config && \
    chmod -R g=u /usr/src/app /etc/config

COPY . /usr/src/app
# make local cache folder writable by 1000 user
RUN cd /usr/src/app/component/node_modules/@huggingface/transformers && rm -Rf .cache && mkdir .cache && chown -R 1000 .cache
# Reinstall onnxruntime-node based on current building platform architecture
RUN cd /usr/src/app/component/node_modules/onnxruntime-node && npm run postinstall
# Reinstall sharp based on current building platform architecture
RUN cd /usr/src/app/component/node_modules && rm -Rf @img && cd sharp && npm install
# download default model
RUN cd /usr/src/app/component && npm run download-default-model

USER 1000
WORKDIR /usr/src/app/component
CMD [ "node", "./node_modules/fastify-cli/cli.js", "start", "-l", "info", "dist/app.js"]