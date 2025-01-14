# magda-embedding-api

![CI Workflow](https://github.com/magda-io/magda-embedding-api/actions/workflows/main.yml/badge.svg?branch=main) [![Release](https://img.shields.io/github/release/magda-io/magda-embedding-api.svg)](https://github.com/magda-io/magda-embedding-api/releases)

An [OpenAI's `embeddings` API](https://platform.openai.com/docs/api-reference/embeddings/create) compatible microservice for Magda.

> See [this test case](./test/integration.test.ts) for an example of how to use this API with [@langchain/openai](https://www.npmjs.com/package/@langchain/openai).

Text embeddings evaluate how closely related text strings are. They are commonly utilized for:

- Search (ranking results based on their relevance to a query)
- Clustering (grouping text strings by similarity)
- Recommendations (suggesting items with similar text strings)
- Anomaly detection (identifying outliers with minimal relatedness)
- Diversity measurement (analyzing similarity distributions)
- Classification (categorizing text strings by their most similar label)

An embedding is a vector, or a list, of floating-point numbers. The distance between two vectors indicates their relatedness, with smaller distances suggesting higher relatedness and larger distances indicating lower relatedness.

This embedding API is created for [Magda](https://github.com/magda-io/magda)'s vector / hybrid search solution. The API interface is compatible with OpenAI's `embeddings` API to make it easier to reuse existing tools & libraries.

### Model Selection & Resources requirements

> Only the default mode, will be included in the docker image to speed up the starting up.
> If you want to use a different model (via `appConfig.modelList`), besides the resources requirements consideration here, you might also want to increase `pluginTimeout` and adjsut `startupProbe` to allow the longer starting up time introduced by the model downloading.

Due to [this issue of ONNX runtime](https://github.com/microsoft/onnxruntime/issues/15080), the peak memory usage of the service is much higher than the model file size (2 times higher).
e.g. For the default 500MB model file, the peak memory usage could up to 1.8GB - 2GB.
However, the memory usage will drop back to much lower (for default model, it's aroudn 800MB-900MB) after the model is loaded.
Please make sure your Kubernetes cluster has enough resources to run the service.

When specify `appConfig.modelList`, you can set `quantized` to `false` to use a quantized model. Please refer to helm chart document below for more informaiton. You can also find an example from this config file [here](./deploy/test-deploy.yaml).

> Memory consumption test result for a few selected models can be found: https://github.com/magda-io/magda-embedding-api/issues/2

## Requirements

Kubernetes: `>= 1.21.0`

| Repository | Name | Version |
|------------|------|---------|
| oci://ghcr.io/magda-io/charts | magda-common | 4.2.1 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| appConfig | object | `{}` | Application configuration of the service. You can supply a list of key-value pairs to be used as the application configuration. Currently, the only supported config field is `modelList`. Via the `modelList` field, you can specify a list of LLM models that the service supports. Although you can specify multiple models, only one model will be used at this moment. Each model item have the following fields:  <ul> <li> `name` (string): The huggingface registered model name. We only support ONNX model at this moment. This field is required. </li> <li> `default` (bool): Optional; Whether this model is the default model. If not specified, the first model in the list will be the default model. Only default model will be loaded. </li> <li> `quantized` (bool): Optional; Whether the quantized version of model will be used. If not specified, the quantized version model will be loaded. </li> <li> `config` (object): Optional; The configuration object that will be passed to the model.  </li> <li> `cache_dir` (string): Optional; The cache directory of the downloaded models. If not specified, the default cache directory will be used. </li> <li> `local_files_only` (bool): Optional; Whether to only load the model from local files. If not specified, the model will be downloaded from the huggingface model hub. </li> <li> `revision` (string) Optional, Default to 'main'; The specific model version to use. It can be a branch name, a tag name, or a commit id.    Since we use a git-based system for storing models and other artifacts on huggingface.co, so `revision` can be any identifier allowed by git. NOTE: This setting is ignored for local requests. </li> <li> `model_file_name` (string) Optional; </li> <li> `extraction_config` (object) Optional; The configuration object that will be passed to the model extraction function for embedding generation. <br/>   <ul>   <li> `pooling`: ('none' or 'mean' or 'cls') Default to 'none'. The pooling method to use. </li>   <li> `normalize`: (bool) Default to true. Whether or not to normalize the embeddings in the last dimension. </li>   <li> `quantize`: (bool) Default to `false`. Whether or not to quantize the embeddings. </li>   <li> `precision`: ("binary" or "ubinary") default to "binary". The precision to use for quantization. Only used when `quantize` is true. </li>   </ul>   </li> </ul> Please note: The released docker image only contains "Alibaba-NLP/gte-base-en-v1.5" model.  If you specify other models, the server will download the model from the huggingface model hub at the startup. You might want to adjust the `startupProbe` settings to accommodate the model downloading time. Depends on the model size, you might also want to adjust the `resources.limits.memory` & `resources.requests.memory`value. |
| autoscaling.hpa.enabled | bool | `false` |  |
| autoscaling.hpa.maxReplicas | int | `3` |  |
| autoscaling.hpa.minReplicas | int | `1` |  |
| autoscaling.hpa.targetCPU | int | `90` |  |
| autoscaling.hpa.targetMemory | string | `""` |  |
| bodyLimit | int | Default to 10485760 (10MB). | Defines the maximum payload, in bytes, that the server is allowed to accept |
| closeGraceDelay | int | Default to 25000 (25s). | The maximum amount of time before forcefully closing pending requests. This should set to a value lower than the Pod's termination grace period (which is default to 30s) |
| debug | bool | `false` | Start Fastify app in debug mode with nodejs inspector inspector port is 9320 |
| defaultImage.imagePullSecret | bool | `false` |  |
| defaultImage.pullPolicy | string | `"IfNotPresent"` |  |
| defaultImage.repository | string | `"ghcr.io/magda-io"` |  |
| deploymentAnnotations | object | `{}` |  |
| envFrom | list | `[]` |  |
| extraContainers | string | `""` |  |
| extraEnvs | list | `[]` |  |
| extraInitContainers | string | `""` |  |
| extraVolumeMounts | list | `[]` |  |
| extraVolumes | list | `[]` |  |
| fullnameOverride | string | `""` |  |
| global.image | object | `{}` |  |
| global.rollingUpdate | object | `{}` |  |
| hostAliases | list | `[]` |  |
| image.name | string | `"magda-embedding-api"` |  |
| lifecycle | object | `{}` | pod lifecycle policies as outlined here: https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/#container-hooks |
| livenessProbe.failureThreshold | int | `10` |  |
| livenessProbe.httpGet.path | string | `"/status/liveness"` |  |
| livenessProbe.httpGet.port | int | `3000` |  |
| livenessProbe.initialDelaySeconds | int | `10` |  |
| livenessProbe.periodSeconds | int | `20` |  |
| livenessProbe.successThreshold | int | `1` |  |
| livenessProbe.timeoutSeconds | int | `5` |  |
| logLevel | string | `"warn"` | The log level of the application. one of 'fatal', 'error', 'warn', 'info', 'debug', 'trace';  also 'silent' is supported to disable logging.  Any other value defines a custom level and requires supplying a level value via levelVal. |
| nameOverride | string | `""` |  |
| nodeSelector | object | `{}` |  |
| pluginTimeout | int | Default to 180000 (180 seconds). | The maximum amount of time in milliseconds in which a fastify plugin can load.  If not, ready will complete with an Error with code 'ERR_AVVIO_PLUGIN_TIMEOUT'. |
| podAnnotations | object | `{}` |  |
| podSecurityContext.runAsNonRoot | bool | `true` |  |
| podSecurityContext.runAsUser | int | `1000` |  |
| priorityClassName | string | `"magda-9"` |  |
| rbac.automountServiceAccountToken | bool | `false` | Controls whether or not the Service Account token is automatically mounted to /var/run/secrets/kubernetes.io/serviceaccount |
| rbac.create | bool | `false` |  |
| rbac.serviceAccountAnnotations | object | `{}` |  |
| rbac.serviceAccountName | string | `""` |  |
| readinessProbe.failureThreshold | int | `10` |  |
| readinessProbe.httpGet.path | string | `"/status/readiness"` |  |
| readinessProbe.httpGet.port | int | `3000` |  |
| readinessProbe.initialDelaySeconds | int | `10` |  |
| readinessProbe.periodSeconds | int | `20` |  |
| readinessProbe.successThreshold | int | `1` |  |
| readinessProbe.timeoutSeconds | int | `5` |  |
| replicas | int | `1` |  |
| resources.limits.memory | string | `"2000M"` | the memory limit of the container Due to [this issue of ONNX runtime](https://github.com/microsoft/onnxruntime/issues/15080), the peak memory usage of the service is much higher than the model file size.  When change the default model, be sure to test the peak memory usage of the service before setting the memory limit. |
| resources.requests.cpu | string | `"100m"` |  |
| resources.requests.memory | string | `"850M"` | the memory request of the container Once the model is loaded, the memory usage of the service for serving request would be much lower. Set to 850M for default model. |
| service.annotations | object | `{}` |  |
| service.httpPortName | string | `"http"` |  |
| service.labels | object | `{}` |  |
| service.loadBalancerIP | string | `""` |  |
| service.loadBalancerSourceRanges | list | `[]` |  |
| service.name | string | `"magda-embedding-api"` |  |
| service.nodePort | string | `""` |  |
| service.port | int | `80` |  |
| service.targetPort | int | `3000` |  |
| service.type | string | `"ClusterIP"` |  |
| startupProbe.failureThreshold | int | `30` |  |
| startupProbe.httpGet.path | string | `"/status/startup"` |  |
| startupProbe.httpGet.port | int | `3000` |  |
| startupProbe.initialDelaySeconds | int | `10` |  |
| startupProbe.periodSeconds | int | `10` |  |
| startupProbe.successThreshold | int | `1` |  |
| startupProbe.timeoutSeconds | int | `5` |  |
| tolerations | list | `[]` |  |
| topologySpreadConstraints | list | `[]` | This is the pod topology spread constraints https://kubernetes.io/docs/concepts/workloads/pods/pod-topology-spread-constraints/ |

### Build & Run for Local Development

> Please note: for production deployment, please use the released [Docker images](https://github.com/magda-io/magda-embedding-api/pkgs/container/magda-embedding-api) & [helm charts](https://github.com/magda-io/magda-embedding-api/pkgs/container/charts%2Fmagda-embedding-api).

#### Prerequisites

- Node.js 18.x
- [Minikube](https://minikube.sigs.k8s.io/) (for local Kubernetes development)
  - [Minikube addons Registry & Registry Aliases are requried](https://minikube.sigs.k8s.io/docs/handbook/addons/registry-aliases/)

#### Install dependencies

```bash
yarn install
```

#### Run the service locally

```bash
yarn start
```

#### Build Docker Image, Push into local Registry & Deploy to minikube Cluster

```bash
yarn build
yarn docker-build-local
```

Deploy to minikube Cluster

```bash
helm -n test upgrade --install test ./deploy/magda-embedding-api -f ./deploy/test-deploy.yaml
```