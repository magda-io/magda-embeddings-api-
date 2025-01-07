FROM node:18-bullseye-slim
ENV NODE_ENV=production

# follow openshfit guidelines for supporting arbitrary user IDs
# https://docs.openshift.com/container-platform/4.16/creating_images/guidelines.html#openshift-container-platform-specific-guidelines
RUN mkdir -p /usr/src/app /etc/config && \
    chgrp -R 0 /usr/src/app /etc/config && \
    chmod -R g=u /usr/src/app /etc/config

COPY . /usr/src/app
# make local cache folder writable by 1000 user
RUN chown -R 1000 /usr/src/app/component/node_modules/@huggingface/transformers/.cache
# Reinstall onnxruntime-node based on current building platform architecture
RUN cd /usr/src/app/component/node_modules/onnxruntime-node && npm run postinstall
# Reinstall sharp based on current building platform architecture
RUN cd /usr/src/app/component/node_modules/sharp && npm run clean && npm run install

USER 1000
WORKDIR /usr/src/app/component
CMD [ "node", "./node_modules/fastify-cli/cli.js", "start", "-l", "info", "dist/app.js"]