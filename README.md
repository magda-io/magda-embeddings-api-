# magda-embedding-api

![CI Workflow](https://github.com/magda-io/magda-embedding-api/workflows/Main%20CI%20Workflow/badge.svg?branch=main) [![Release](https://img.shields.io/github/release/magda-io/magda-embedding-api.svg)](https://github.com/magda-io/magda-embedding-api/releases)

An [OpenAI's `embeddings` API](https://platform.openai.com/docs/api-reference/embeddings/create) compatible microservice for Magda.

Text embeddings evaluate how closely related text strings are. They are commonly utilized for:

- Search (ranking results based on their relevance to a query)
- Clustering (grouping text strings by similarity)
- Recommendations (suggesting items with similar text strings)
- Anomaly detection (identifying outliers with minimal relatedness)
- Diversity measurement (analyzing similarity distributions)
- Classification (categorizing text strings by their most similar label)

An embedding is a vector, or a list, of floating-point numbers. The distance between two vectors indicates their relatedness, with smaller distances suggesting higher relatedness and larger distances indicating lower relatedness.

This embedding API is created for [Magda](https://github.com/magda-io/magda)'s vector / hybrid search solution. The API interface is compatible with OpenAI's `embeddings` API to make it easier to reuse existing tools & libraries.

## Requirements

Kubernetes: `>= 1.21.0`

| Repository | Name | Version |
|------------|------|---------|
| oci://ghcr.io/magda-io/charts | magda-common | 4.2.1 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| autoscaling.hpa.enabled | bool | `false` |  |
| autoscaling.hpa.maxReplicas | int | `3` |  |
| autoscaling.hpa.minReplicas | int | `1` |  |
| autoscaling.hpa.targetCPU | int | `90` |  |
| autoscaling.hpa.targetMemory | string | `""` |  |
| debug | bool | `false` |  |
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
| livenessProbe.initialDelaySeconds | int | `10` |  |
| livenessProbe.periodSeconds | int | `20` |  |
| livenessProbe.successThreshold | int | `1` |  |
| livenessProbe.tcpSocket.port | int | `5601` |  |
| livenessProbe.timeoutSeconds | int | `5` |  |
| nameOverride | string | `""` |  |
| nodeSelector | object | `{}` |  |
| podAnnotations | object | `{}` |  |
| podSecurityContext.runAsUser | int | `1000` |  |
| priorityClassName | string | `"magda-9"` |  |
| rbac.automountServiceAccountToken | bool | `false` | Controls whether or not the Service Account token is automatically mounted to /var/run/secrets/kubernetes.io/serviceaccount |
| rbac.create | bool | `false` |  |
| rbac.serviceAccountAnnotations | object | `{}` |  |
| rbac.serviceAccountName | string | `""` |  |
| readinessProbe.failureThreshold | int | `10` |  |
| readinessProbe.initialDelaySeconds | int | `10` |  |
| readinessProbe.periodSeconds | int | `20` |  |
| readinessProbe.successThreshold | int | `1` |  |
| readinessProbe.tcpSocket.port | int | `5601` |  |
| readinessProbe.timeoutSeconds | int | `5` |  |
| replicas | int | `1` |  |
| resources.limits.memory | string | `"512M"` |  |
| resources.requests.cpu | string | `"100m"` |  |
| resources.requests.memory | string | `"512M"` |  |
| service.annotations | object | `{}` |  |
| service.httpPortName | string | `"http"` |  |
| service.labels | object | `{}` |  |
| service.loadBalancerIP | string | `""` |  |
| service.loadBalancerSourceRanges | list | `[]` |  |
| service.name | string | `"magda-embedding-api"` |  |
| service.nodePort | string | `""` |  |
| service.port | int | `5601` |  |
| service.type | string | `"ClusterIP"` |  |
| startupProbe.failureThreshold | int | `20` |  |
| startupProbe.initialDelaySeconds | int | `10` |  |
| startupProbe.periodSeconds | int | `10` |  |
| startupProbe.successThreshold | int | `1` |  |
| startupProbe.tcpSocket.port | int | `5601` |  |
| startupProbe.timeoutSeconds | int | `5` |  |
| tolerations | list | `[]` |  |
| topologySpreadConstraints | list | `[]` | This is the pod topology spread constraints https://kubernetes.io/docs/concepts/workloads/pods/pod-topology-spread-constraints/ |