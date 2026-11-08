import type { Sheet } from '../types'

const kubernetes: Sheet = {
  id: 'kubernetes',
  label: 'Kubernetes',
  lang: 'yaml',
  accent: '#326ce5',
  sections: [
    {
      title: 'The mental model',
      blurb: 'You never tell Kubernetes what to do. You write down what should be true, and controllers keep making it true.',
      snippets: [
        {
          lang: 'shell',
          code: `# Deployment  owns ->  ReplicaSet  owns ->  Pod  contains ->  container(s)
# Service     gives a stable name + load balancing to a set of Pods
# Ingress     routes outside HTTP traffic to Services
# ConfigMap / Secret   inject configuration
# PVC         asks for storage that outlives the Pod
#
# Every object:  apiVersion + kind + metadata + spec   (status is the cluster's reply)
#
# Pods are cattle. They get deleted, rescheduled and renamed constantly.
# Never point anything at a pod name — point it at a Service.`,
        },
      ],
    },
    {
      title: 'kubectl: the daily driver',
      snippets: [
        {
          lang: 'shell',
          code: `kubectl get pods                       # in the current namespace
kubectl get pods -A                    # every namespace
kubectl get pods -o wide               # + node and pod IP
kubectl get pods -w                    # watch them change
kubectl get deploy,svc,ingress         # several kinds at once
kubectl get pod api-7d9f -o yaml       # the whole object

kubectl describe pod api-7d9f          # events at the bottom: read those first
kubectl logs -f deploy/api             # follow a deployment's logs
kubectl logs api-7d9f -c sidecar       # one container in the pod
kubectl logs api-7d9f --previous       # the CRASHED instance's logs
kubectl exec -it api-7d9f -- sh
kubectl port-forward svc/api 8080:80   # reach a cluster service from your laptop

kubectl apply -f k8s/                  # apply a whole folder
kubectl delete -f k8s/deploy.yaml
kubectl diff -f k8s/                   # what WOULD change`,
        },
        {
          note: 'Context, namespace and output',
          lang: 'shell',
          code: `kubectl config get-contexts
kubectl config use-context prod
kubectl config set-context --current --namespace=payments

kubectl get pods -l app=api,tier=backend          # label selector
kubectl get pods --field-selector status.phase=Running
kubectl get pods -o jsonpath='{.items[*].spec.containers[*].image}'
kubectl get pods --sort-by=.status.containerStatuses[0].restartCount
kubectl get events --sort-by=.lastTimestamp | tail -30
kubectl top pods --sort-by=memory                  # needs metrics-server

alias k=kubectl
source <(kubectl completion bash)`,
        },
        {
          note: 'Editing live objects',
          lang: 'shell',
          code: `kubectl edit deploy api                            # opens $EDITOR
kubectl scale deploy api --replicas=5
kubectl set image deploy/api api=myapp:1.4
kubectl rollout restart deploy/api                 # re-roll, e.g. to pick up a Secret
kubectl patch deploy api -p '{"spec":{"replicas":3}}'
kubectl annotate deploy api kubernetes.io/change-cause="hotfix 1.4"
kubectl label pod api-7d9f debug=true

# Generate YAML instead of writing it from scratch:
kubectl create deploy api --image=myapp:1.0 --dry-run=client -o yaml > deploy.yaml
kubectl create cm app-config --from-file=./config.yaml --dry-run=client -o yaml`,
        },
      ],
    },
    {
      title: 'Deployment: the full manifest',
      snippets: [
        {
          code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: payments
  labels: { app: api }
spec:
  replicas: 3
  revisionHistoryLimit: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1            # extra pods allowed during the roll
      maxUnavailable: 0      # never go below the replica count
  selector:
    matchLabels: { app: api }      # MUST match template.metadata.labels
  template:
    metadata:
      labels: { app: api }
      annotations:
        prometheus.io/scrape: "true"
    spec:
      serviceAccountName: api
      terminationGracePeriodSeconds: 30
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
        fsGroup: 10001
      containers:
        - name: api
          image: ghcr.io/me/api:1.4.0      # a real tag, never :latest
          imagePullPolicy: IfNotPresent
          ports:
            - { name: http, containerPort: 3000 }
          env:
            - name: NODE_ENV
              value: production
            - name: POD_IP
              valueFrom: { fieldRef: { fieldPath: status.podIP } }
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef: { name: api-secrets, key: database-url }
          envFrom:
            - configMapRef: { name: api-config }
          resources:
            requests: { cpu: 100m, memory: 128Mi }   # what the scheduler reserves
            limits:   { cpu: "1",  memory: 512Mi }   # the ceiling
          startupProbe:                 # for slow boots: the other probes wait for it
            httpGet: { path: /health, port: http }
            failureThreshold: 30
            periodSeconds: 2
          readinessProbe:               # "send me traffic?"  fail -> out of the Service
            httpGet: { path: /ready, port: http }
            periodSeconds: 5
          livenessProbe:                # "are you wedged?"   fail -> restart the container
            httpGet: { path: /health, port: http }
            periodSeconds: 10
            failureThreshold: 3
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities: { drop: ["ALL"] }
          volumeMounts:
            - { name: tmp, mountPath: /tmp }
      volumes:
        - name: tmp
          emptyDir: {}`,
        },
        {
          note: 'Rollouts',
          lang: 'shell',
          code: `kubectl rollout status deploy/api          # blocks until done or stuck
kubectl rollout history deploy/api
kubectl rollout undo deploy/api            # back one revision
kubectl rollout undo deploy/api --to-revision=3
kubectl rollout pause deploy/api           # stop mid-roll to look around
kubectl rollout resume deploy/api

# maxUnavailable: 0 + a correct readinessProbe = a genuinely zero-downtime roll.
# No readinessProbe means traffic hits pods that are still booting.`,
        },
      ],
    },
    {
      title: 'Services & Ingress',
      snippets: [
        {
          code: `apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: ClusterIP          # ClusterIP | NodePort | LoadBalancer | ExternalName
  selector: { app: api }   # which pods — by LABEL, never by name
  ports:
    - name: http
      port: 80             # the port the Service listens on
      targetPort: http     # the container's port (name or number)
---
# DNS inside the cluster:
#   api                      same namespace
#   api.payments             another namespace
#   api.payments.svc.cluster.local    fully qualified
---
apiVersion: v1
kind: Service
metadata:
  name: db
spec:
  clusterIP: None          # headless: DNS returns each pod IP (StatefulSets)
  selector: { app: db }
  ports: [{ port: 5432 }]`,
        },
        {
          code: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: 20m
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  ingressClassName: nginx
  tls:
    - hosts: [api.example.com]
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port: { number: 80 }`,
        },
      ],
    },
    {
      title: 'Config & Secrets',
      snippets: [
        {
          code: `apiVersion: v1
kind: ConfigMap
metadata: { name: api-config }
data:
  LOG_LEVEL: "info"
  FEATURE_FLAGS: "newCheckout,fastPath"
  config.yaml: |
    server:
      timeout: 30s
      retries: 3
---
apiVersion: v1
kind: Secret
metadata: { name: api-secrets }
type: Opaque
stringData:                 # stringData takes plain text; "data" wants base64
  database-url: postgres://app:hunter2@db:5432/app
  api-key: sk-live-123`,
        },
        {
          note: 'Three ways to consume them',
          code: `env:
  - name: LOG_LEVEL
    valueFrom: { configMapKeyRef: { name: api-config, key: LOG_LEVEL } }
envFrom:
  - configMapRef: { name: api-config }     # every key becomes an env var
  - secretRef:    { name: api-secrets }
volumeMounts:
  - name: config
    mountPath: /etc/app
    readOnly: true
volumes:
  - name: config
    configMap:
      name: api-config
      items: [{ key: config.yaml, path: config.yaml }]`,
        },
        {
          note: 'The gotchas',
          lang: 'shell',
          code: `# 1. Secrets are base64, NOT encryption. Anyone with get-secret can read them.
kubectl get secret api-secrets -o jsonpath='{.data.api-key}' | base64 -d

# 2. Env vars do NOT update when the ConfigMap changes. Mounted files do
#    (after a minute or so). To pick up new env values you must re-roll:
kubectl rollout restart deploy/api

# 3. Keep real secrets out of git: sealed-secrets, external-secrets, SOPS,
#    or the cloud provider's secret store with a CSI driver.

kubectl create secret generic api-secrets \\
  --from-literal=api-key=sk-live-123 \\
  --from-file=tls.crt=./cert.pem
kubectl create secret docker-registry ghcr \\
  --docker-server=ghcr.io --docker-username=me --docker-password="$TOKEN"`,
        },
      ],
    },
    {
      title: 'Resources, scaling & disruption',
      snippets: [
        {
          note: 'requests vs limits — the thing people get wrong',
          code: `resources:
  requests: { cpu: 100m, memory: 128Mi }   # scheduling + the QoS class
  limits:   { cpu: "1",  memory: 512Mi }   # enforcement

# CPU over the limit  -> throttled (slow)
# Memory over the limit -> OOMKilled (dead, exit 137)
#
# requests == limits            -> Guaranteed  (evicted last)
# requests <  limits            -> Burstable
# neither set                   -> BestEffort  (evicted first — never in production)
#
# Set memory requests == limits. Leave CPU limits off unless you must cap a
# noisy neighbour: CPU throttling hurts latency more than it saves anyone.`,
        },
        {
          code: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 70 }   # % of the REQUEST
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300      # do not flap
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: api }
spec:
  minAvailable: 2          # node drains must respect this
  selector: { matchLabels: { app: api } }`,
        },
        {
          note: 'Where pods land',
          code: `spec:
  nodeSelector: { disktype: ssd }
  tolerations:
    - { key: "gpu", operator: "Exists", effect: "NoSchedule" }
  topologySpreadConstraints:          # spread across zones, do not pile up
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
      labelSelector: { matchLabels: { app: api } }
  affinity:
    podAntiAffinity:                  # keep replicas off the same node
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            topologyKey: kubernetes.io/hostname
            labelSelector: { matchLabels: { app: api } }

# A taint on a node repels pods; a toleration on a pod lets it ignore the taint.
#   kubectl taint nodes node1 gpu=true:NoSchedule`,
        },
      ],
    },
    {
      title: 'Other workload kinds',
      snippets: [
        {
          note: 'StatefulSet — stable names, stable storage, ordered rollout',
          code: `apiVersion: apps/v1
kind: StatefulSet
metadata: { name: pg }
spec:
  serviceName: pg          # must be a headless Service
  replicas: 3
  selector: { matchLabels: { app: pg } }
  template:
    metadata: { labels: { app: pg } }
    spec:
      containers:
        - name: pg
          image: postgres:16
          volumeMounts: [{ name: data, mountPath: /var/lib/postgresql/data }]
  volumeClaimTemplates:    # one PVC per pod, kept when the pod dies
    - metadata: { name: data }
      spec:
        accessModes: [ReadWriteOnce]
        resources: { requests: { storage: 20Gi } }

# pods are pg-0, pg-1, pg-2 — predictable DNS: pg-0.pg.default.svc.cluster.local`,
        },
        {
          note: 'Job & CronJob',
          code: `apiVersion: batch/v1
kind: Job
metadata: { name: migrate }
spec:
  backoffLimit: 3
  ttlSecondsAfterFinished: 600
  template:
    spec:
      restartPolicy: Never
      containers:
        - { name: migrate, image: ghcr.io/me/api:1.4.0, command: ["npm","run","migrate"] }
---
apiVersion: batch/v1
kind: CronJob
metadata: { name: nightly-report }
spec:
  schedule: "0 2 * * *"
  timeZone: "America/Toronto"
  concurrencyPolicy: Forbid          # never two at once
  successfulJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - { name: report, image: ghcr.io/me/jobs:1.4.0, args: ["report"] }`,
        },
        {
          note: 'DaemonSet, initContainers and sidecars',
          code: `kind: DaemonSet        # exactly one pod per node: log shippers, node agents
---
spec:
  initContainers:        # run to completion, in order, BEFORE the app starts
    - name: wait-for-db
      image: busybox:1.36
      command: ["sh","-c","until nc -z db 5432; do sleep 1; done"]
    - name: migrate
      image: ghcr.io/me/api:1.4.0
      command: ["npm","run","migrate"]
      restartPolicy: Always    # <- makes it a native SIDECAR: stays up alongside the app`,
        },
      ],
    },
    {
      title: 'Storage',
      snippets: [
        {
          code: `apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: uploads }
spec:
  accessModes: [ReadWriteOnce]     # RWO one node | ROX many readers | RWX many writers
  storageClassName: gp3
  resources: { requests: { storage: 50Gi } }
---
spec:
  containers:
    - name: api
      volumeMounts: [{ name: uploads, mountPath: /data }]
  volumes:
    - name: uploads
      persistentVolumeClaim: { claimName: uploads }
---
# other volume types you will meet
#   emptyDir: {}                 scratch, dies with the pod
#   emptyDir: { medium: Memory } a tmpfs
#   configMap / secret           files from config
#   hostPath                     a path on the node (avoid; breaks portability)`,
        },
      ],
    },
    {
      title: 'RBAC & service accounts',
      snippets: [
        {
          code: `apiVersion: v1
kind: ServiceAccount
metadata: { name: api, namespace: payments }
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role                      # namespaced. ClusterRole = cluster-wide
metadata: { namespace: payments, name: config-reader }
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { namespace: payments, name: api-config-reader }
subjects:
  - { kind: ServiceAccount, name: api, namespace: payments }
roleRef: { kind: Role, name: config-reader, apiGroup: rbac.authorization.k8s.io }`,
        },
        {
          note: 'Check permissions instead of guessing',
          lang: 'shell',
          code: `kubectl auth can-i delete pods
kubectl auth can-i get secrets --as=system:serviceaccount:payments:api -n payments
kubectl auth can-i --list -n payments

# automountServiceAccountToken: false  on pods that never call the API server`,
        },
      ],
    },
    {
      title: 'Namespaces, quotas & NetworkPolicy',
      snippets: [
        {
          code: `apiVersion: v1
kind: ResourceQuota
metadata: { name: team-quota, namespace: payments }
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 40Gi
    pods: "50"
---
apiVersion: v1
kind: LimitRange              # defaults for pods that forget to ask
metadata: { name: defaults, namespace: payments }
spec:
  limits:
    - type: Container
      default:        { cpu: 500m, memory: 512Mi }
      defaultRequest: { cpu: 100m, memory: 128Mi }`,
        },
        {
          note: 'Deny everything, then allow what you mean',
          code: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny, namespace: payments }
spec:
  podSelector: {}                     # every pod in the namespace
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: api-allows-web, namespace: payments }
spec:
  podSelector: { matchLabels: { app: api } }
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector: { matchLabels: { app: web } }
        - namespaceSelector: { matchLabels: { name: ingress-nginx } }
      ports: [{ protocol: TCP, port: 3000 }]

# NetworkPolicies only do anything if your CNI enforces them (Calico, Cilium...).`,
        },
      ],
    },
    {
      title: 'Debugging: the decision tree',
      snippets: [
        {
          lang: 'shell',
          code: `kubectl get pod api-7d9f                 # 1. what does STATUS say?
kubectl describe pod api-7d9f            # 2. read Events at the bottom
kubectl logs api-7d9f --previous         # 3. the dead container's last words

# Pending            nothing can schedule it
#   -> describe: "Insufficient cpu/memory"  = cluster is full, or requests too big
#   -> "node(s) had untolerated taint"      = needs a toleration
#   -> "pod has unbound PersistentVolumeClaim" = storage not provisioned
# ImagePullBackOff   wrong name/tag, private registry with no imagePullSecrets
# CrashLoopBackOff   the container starts and dies — read --previous logs
# CreateContainerConfigError  a ConfigMap/Secret key in env does not exist
# OOMKilled (137)    memory limit too low, or a leak
# Error / Completed  it ran and exited; your CMD was not long-running
# Terminating stuck  a finalizer, or terminationGracePeriod not elapsed
# Running, 0/1 READY the readinessProbe is failing — that is the one to check`,
        },
        {
          note: 'Tools for when logs are not enough',
          lang: 'shell',
          code: `kubectl debug -it api-7d9f --image=nicolaka/netshoot --target=api  # sidecar debugger
kubectl debug node/node1 -it --image=busybox                       # a shell on a node
kubectl run tmp --rm -it --image=nicolaka/netshoot -- sh           # throwaway pod

# inside it:
#   nslookup api.payments.svc.cluster.local
#   curl -v http://api/health
#   nc -zv db 5432

kubectl get endpoints api        # EMPTY = the Service selector matches no ready pod.
                                 # This is the #1 cause of "my service doesn't work".
kubectl get events -A --sort-by=.lastTimestamp | tail -40
kubectl describe node node1      # pressure conditions, allocatable vs allocated`,
        },
      ],
    },
    {
      title: 'Kustomize & Helm',
      snippets: [
        {
          note: 'Kustomize — plain YAML plus overlays, built into kubectl',
          code: `# base/kustomization.yaml
resources: [deployment.yaml, service.yaml]
commonLabels: { app: api }

# overlays/prod/kustomization.yaml
resources: [../../base]
namespace: payments
images:
  - name: ghcr.io/me/api
    newTag: 1.4.0
replicas:
  - { name: api, count: 10 }
patches:
  - path: resources-patch.yaml
    target: { kind: Deployment, name: api }
configMapGenerator:
  - name: api-config
    literals: [LOG_LEVEL=warn]      # name gets a hash suffix -> pods re-roll on change`,
        },
        {
          lang: 'shell',
          code: `kubectl apply -k overlays/prod
kubectl kustomize overlays/prod        # render it without applying

helm repo add bitnami https://charts.bitnami.com/bitnami
helm install pg bitnami/postgresql -f values.yaml -n data --create-namespace
helm upgrade --install api ./chart -f values.prod.yaml --atomic --timeout 5m
helm template api ./chart -f values.prod.yaml   # render locally; diff it in review
helm history api
helm rollback api 3
helm uninstall api`,
        },
      ],
    },
    {
      title: 'Local clusters & handy habits',
      snippets: [
        {
          lang: 'shell',
          code: `kind create cluster --name dev
minikube start --cpus 4 --memory 8g
k3d cluster create dev -p "8080:80@loadbalancer"

kind load docker-image myapp:dev --name dev     # no registry needed
minikube image load myapp:dev

# Keep manifests in git and apply folders, never kubectl edit in production:
#   k8s/base/...         k8s/overlays/{dev,prod}/...
# Validate before you apply:
kubectl apply --dry-run=server -f k8s/
kubeconform -strict k8s/            # or kubeval
kubectl explain deployment.spec.strategy    # built-in field docs`,
        },
      ],
    },
    {
      title: 'Common mistakes',
      snippets: [
        {
          lang: 'shell',
          code: `image: myapp:latest              -> rollouts do nothing, nobody knows what is running
no resource requests            -> BestEffort pods, evicted first, scheduled blindly
no readinessProbe               -> traffic to booting pods, every deploy drops requests
livenessProbe == readinessProbe -> a slow dependency restarts your healthy container
liveness probe too aggressive   -> restart loops under load, making the load worse
selector does not match labels  -> Service with no endpoints, silent 503s
secrets committed to git        -> base64 is not encryption
no PodDisruptionBudget          -> a node drain takes the whole service down
one huge namespace              -> no quotas, no NetworkPolicy, no blast radius
kubectl edit in production      -> the next apply from git silently reverts your fix
ignoring kubectl describe       -> the answer was in Events the whole time`,
        },
      ],
    },
  ],
}

export default kubernetes
