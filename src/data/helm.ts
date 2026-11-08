import type { Sheet } from '../types'

const helm: Sheet = {
  id: 'helm',
  label: 'Helm',
  lang: 'yaml',
  accent: '#0f1689',
  sections: [
    {
      title: 'The mental model',
      blurb: 'A chart is a folder of templates. Values fill them in. The rendered manifests get applied to the cluster and recorded as a release you can roll back.',
      snippets: [
        {
          lang: 'shell',
          code: `#   chart (templates + values.yaml)
#      +  your -f values.prod.yaml / --set overrides
#      =  rendered Kubernetes manifests
#      -> applied to the cluster, stored as RELEASE revision N
#
# chart    the package      (a folder, or a .tgz, or an OCI artifact)
# release  one install of that chart, with a name, in a namespace
# revision every upgrade bumps it; rollback goes back to any of them
#
# Helm 3 keeps release state in a Secret in the release's namespace.
# No Tiller, no cluster-side component.

helm install api ./chart              # chart -> release "api", revision 1
helm upgrade api ./chart --set replicaCount=5   # revision 2
helm rollback api 1                             # revision 3, identical to 1`,
        },
      ],
    },
    {
      title: 'The commands you actually use',
      snippets: [
        {
          lang: 'shell',
          code: `helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo postgres --versions
helm show values bitnami/postgresql > values.yaml   # ALWAYS read this first
helm show chart bitnami/postgresql
helm show readme bitnami/postgresql

helm install pg bitnami/postgresql -n data --create-namespace -f values.yaml
helm upgrade --install api ./chart -f values.prod.yaml --atomic --timeout 5m
helm uninstall api -n payments           # add --keep-history to keep the record

helm list -A                             # every release, every namespace
helm list -a                             # include failed / pending ones
helm status api
helm history api
helm rollback api 4 --wait
helm get values api                      # the values that are actually live
helm get manifest api                    # what is actually in the cluster
helm get notes api`,
        },
        {
          note: 'The flags that save you',
          lang: 'shell',
          code: `--install          upgrade, or install if it is not there yet (use this always)
--atomic           roll back automatically if the upgrade fails. Implies --wait
--wait             block until pods are ready / jobs complete
--timeout 10m      how long --wait waits before giving up (default 5m)
--cleanup-on-fail  delete new resources created by a failed upgrade
--create-namespace
--dry-run=server   render AND validate against the real API server
--debug            print the computed values and the full error
--reset-values     start from the chart defaults, ignore the previous release's
--reuse-values     keep the previous release's values and merge yours on top
--version 13.2.1   pin the chart version. Not pinning is how prod drifts
--force            delete and recreate. Last resort: it causes downtime`,
        },
      ],
    },
    {
      title: 'Chart layout',
      snippets: [
        {
          lang: 'shell',
          code: `helm create mychart       # scaffolds a working chart you can strip down

mychart/
  Chart.yaml           # name, version, appVersion, dependencies
  values.yaml          # the DEFAULTS, and the documentation of every option
  values.schema.json   # optional: validates user values before rendering
  .helmignore          # like .gitignore, for packaging
  charts/              # vendored subcharts (.tgz) after "helm dependency update"
  crds/                # CRDs installed first, never templated, never upgraded
  templates/
    deployment.yaml
    service.yaml
    ingress.yaml
    serviceaccount.yaml
    hpa.yaml
    _helpers.tpl       # named templates; files starting with _ render nothing
    NOTES.txt          # printed after install — a template too
    tests/
      test-connection.yaml`,
        },
        {
          note: 'Chart.yaml',
          code: `apiVersion: v2              # v2 = Helm 3
name: api
description: The payments API
type: application           # application | library
version: 1.4.0              # the CHART version — bump on every chart change
appVersion: "2.7.1"         # the app inside it. Quoted, or 1.10 becomes 1.1
kubeVersion: ">=1.27.0-0"
keywords: [api, payments]
home: https://example.com
maintainers:
  - { name: Fateme, email: me@example.com }
dependencies:
  - name: postgresql
    version: "15.5.x"
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled      # a values key that switches it on/off
    alias: db                          # reach it as .Values.db
  - name: redis
    version: "19.x.x"
    repository: oci://registry-1.docker.io/bitnamicharts
    tags: [cache]`,
        },
        {
          lang: 'shell',
          code: `helm dependency update ./chart     # resolve + download into charts/, write Chart.lock
helm dependency build ./chart      # install exactly what Chart.lock pins
helm dependency list ./chart`,
        },
      ],
    },
    {
      title: 'Values & precedence',
      snippets: [
        {
          note: 'values.yaml is also your documentation — comment every key',
          code: `replicaCount: 2

image:
  repository: ghcr.io/me/api
  tag: ""                 # defaults to .Chart.AppVersion when empty
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  className: nginx
  hosts:
    - host: api.example.com
      paths: [{ path: /, pathType: Prefix }]
  tls: []

resources:
  requests: { cpu: 100m, memory: 128Mi }
  limits:   { memory: 512Mi }

env: {}                   # free-form: { LOG_LEVEL: info }
nodeSelector: {}
tolerations: []
affinity: {}

postgresql:
  enabled: true           # reaches the SUBCHART, not this chart`,
        },
        {
          note: 'Who wins: later beats earlier',
          lang: 'shell',
          code: `# 1. the chart's own values.yaml          (lowest)
# 2. a parent chart's values for a subchart
# 3. -f values.a.yaml   then  -f values.b.yaml    (left to right)
# 4. --set / --set-string / --set-file / --set-json   (highest)

helm upgrade api ./chart \\
  -f values.yaml -f values.prod.yaml \\
  --set image.tag=1.4.2 \\
  --set-string annotations.revision=00123 \\      # keeps it a string
  --set ingress.hosts[0].host=api.example.com \\  # list index
  --set "env.JAVA_OPTS=-Xmx512m\\, -Xms256m" \\     # escape commas
  --set-file config=./app.conf \\                 # file contents as the value
  --set-json 'tolerations=[{"key":"gpu","operator":"Exists"}]'

# Maps merge, LISTS REPLACE. You cannot append one item to a list from -f.
# --set null deletes a key:  --set resources.limits.cpu=null`,
        },
      ],
    },
    {
      title: 'Templates: the basics',
      snippets: [
        {
          code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "api.fullname" . }}
  labels:
    {{- include "api.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "api.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "api.selectorLabels" . | nindent 8 }}
    spec:
      serviceAccountName: {{ include "api.serviceAccountName" . }}
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - containerPort: 3000
          resources:
            {{- toYaml .Values.resources | nindent 12 }}`,
        },
        {
          note: 'The built-in objects',
          code: `{{ .Values.anything }}          # merged values
{{ .Release.Name }}             # api
{{ .Release.Namespace }}
{{ .Release.Revision }}         # 1, 2, 3...
{{ .Release.IsInstall }}        # true on first install
{{ .Release.IsUpgrade }}
{{ .Chart.Name }} {{ .Chart.Version }} {{ .Chart.AppVersion }}
{{ .Capabilities.KubeVersion.Version }}
{{ .Capabilities.APIVersions.Has "networking.k8s.io/v1" }}
{{ .Files.Get "config/app.conf" }}
{{ .Files.Glob "dashboards/*.json" | toYaml }}
{{ .Template.Name }}            # the file being rendered`,
        },
      ],
    },
    {
      title: 'Functions & pipelines',
      snippets: [
        {
          code: `{{ .Values.name | default "api" | quote }}        # read it left to right
{{ required "image.repository is required!" .Values.image.repository }}
{{ .Values.replicas | int }}
{{ .Values.price | float64 }}
{{ printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{ toYaml .Values.resources | nindent 12 }}      # a whole map, indented
{{ toJson .Values.config }}
{{ .Values.config | toYaml | b64enc }}           # for Secret data:
{{ "hello" | sha256sum }}
{{ now | date "2006-01-02" }}
{{ .Values.text | upper | lower | title }}
{{ .Values.list | join "," }}
{{ splitList "," .Values.csv | toYaml }}
{{ ternary "on" "off" .Values.enabled }}
{{ coalesce .Values.a .Values.b "fallback" }}
{{ dig "image" "tag" "latest" .Values }}          # safe deep lookup
{{ tpl .Values.templatedString . }}               # render a string as a template
{{ lookup "v1" "Secret" .Release.Namespace "db" }} # read the LIVE cluster (empty on dry-run)
{{ uuidv4 }}  {{ randAlphaNum 16 }}               # changes every render — see Mistakes`,
        },
        {
          note: 'Generate a password once and keep it on upgrades',
          code: `{{- $secret := lookup "v1" "Secret" .Release.Namespace "api-db" }}
apiVersion: v1
kind: Secret
metadata:
  name: api-db
type: Opaque
data:
  password: {{ if $secret }}{{ index $secret.data "password" }}{{ else }}{{ randAlphaNum 24 | b64enc | quote }}{{ end }}`,
        },
      ],
    },
    {
      title: 'Flow control & scope',
      snippets: [
        {
          code: `{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
...
{{- end }}

{{- if eq .Values.service.type "LoadBalancer" }}
...
{{- else if .Values.service.nodePort }}
...
{{- else }}
...
{{- end }}

# comparisons are FUNCTIONS, not operators
{{ if and .Values.a .Values.b }}  {{ if or .Values.a .Values.b }}
{{ if not .Values.a }}  {{ if eq .a .b }}  {{ if ne }}  {{ if lt }}  {{ if gt }}
{{ if empty .Values.list }}  {{ if hasKey .Values "foo" }}  {{ if contains "x" .s }}

# falsy: false, 0, "", nil, empty list/map`,
        },
        {
          note: 'range and with — and the dot that bites everyone',
          code: `env:
  {{- range $key, $value := .Values.env }}
  - name: {{ $key }}
    value: {{ $value | quote }}
  {{- end }}

  {{- range .Values.extraEnv }}
  - name: {{ .name }}            # inside range, "." IS the current item
    value: {{ .value | quote }}
  {{- end }}

{{- with .Values.nodeSelector }}
nodeSelector:
  {{- toYaml . | nindent 2 }}    # "with" also rebinds "." — and skips if empty
{{- end }}

# Need the root inside range/with? $ is always the root context:
{{- range .Values.hosts }}
  - host: {{ . }}
    release: {{ $.Release.Name }}      # <- $ , not .
{{- end }}

{{- $fullName := include "api.fullname" . -}}   # variables survive scope changes`,
        },
      ],
    },
    {
      title: 'Named templates (_helpers.tpl)',
      snippets: [
        {
          code: `{{/* The name, truncated to the 63-char limit Kubernetes imposes */}}
{{- define "api.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "api.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else if contains .Chart.Name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "api.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{ include "api.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}`,
        },
        {
          note: 'include vs template',
          code: `{{ include "api.labels" . | nindent 4 }}   # returns a STRING -> pipeable. Use this
{{ template "api.labels" . }}             # prints straight out, cannot be piped

# always pass the context ( "." ), or the template sees nothing
# selectorLabels must NEVER contain version — selectors are immutable after create`,
        },
      ],
    },
    {
      title: 'Whitespace',
      blurb: 'Half of all Helm errors are indentation. These three rules fix most of them.',
      snippets: [
        {
          code: `{{- ... }}   trims whitespace and the newline BEFORE the action
{{ ... -}}   trims whitespace and the newline AFTER it

# 1. Control lines get a left dash so they do not leave blank lines:
{{- if .Values.enabled }}
key: value
{{- end }}

# 2. Inserting a block? Use nindent, and put the dash on the line before:
metadata:
  labels:
    {{- include "api.labels" . | nindent 4 }}
#   ^ the dash eats the newline, nindent adds its own + indents every line

# 3. indent vs nindent
#    indent 4   indents every line, no leading newline
#    nindent 4  = "\\n" + indent 4   <- the one you want after a "key:" line

# Debug it by looking at the YAML, not the template:
#   helm template . --show-only templates/deployment.yaml`,
        },
      ],
    },
    {
      title: 'Subcharts, globals & conditions',
      snippets: [
        {
          code: `# parent values.yaml
global:                      # every subchart sees .Values.global.*
  imageRegistry: ghcr.io
  storageClass: gp3

postgresql:                  # keys under the subchart NAME go to that subchart
  enabled: true
  auth:
    database: app
  primary:
    persistence:
      size: 20Gi

tags:
  cache: false               # switches off every dependency tagged "cache"`,
        },
        {
          note: 'Pull a value back up from a subchart',
          code: `# in Chart.yaml
dependencies:
  - name: postgresql
    version: "15.x.x"
    repository: https://charts.bitnami.com/bitnami
    import-values:
      - child: auth
        parent: database      # subchart's .Values.auth -> parent's .Values.database

# condition beats tags; condition wins if both are set.
# A subchart cannot read the parent's values — only "global" crosses the border.`,
        },
      ],
    },
    {
      title: 'Hooks',
      blurb: 'Resources that run at a point in the release lifecycle instead of being part of it.',
      snippets: [
        {
          code: `apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "api.fullname" . }}-migrate
  annotations:
    "helm.sh/hook": pre-upgrade,pre-install
    "helm.sh/hook-weight": "-5"           # lower runs first; a STRING
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  backoffLimit: 2
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          command: ["npm", "run", "migrate"]`,
        },
        {
          note: 'The hook points and the delete policies',
          code: `# pre-install    post-install
# pre-upgrade    post-upgrade
# pre-rollback   post-rollback
# pre-delete     post-delete
# test                              (helm test runs these)
#
# hook-delete-policy
#   before-hook-creation  delete the previous one first (default; fixes "job exists")
#   hook-succeeded        clean up after it passes
#   hook-failed           clean up after it fails — hides the logs, so think twice
#
# A hook resource is NOT tracked by the release: helm uninstall will not remove it
# unless a delete policy already did. Helm waits for each hook to finish before
# moving on, so a hanging migration blocks the whole upgrade.`,
        },
        {
          note: 'helm test',
          code: `apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "api.fullname" . }}-test"
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  restartPolicy: Never
  containers:
    - name: curl
      image: curlimages/curl:8.8.0
      args: ["-sfS", "http://{{ include "api.fullname" . }}:{{ .Values.service.port }}/health"]

# helm test api --logs`,
        },
      ],
    },
    {
      title: 'Rolling pods when config changes',
      blurb: 'A ConfigMap or Secret change does not restart anything by itself. This annotation is the standard fix.',
      snippets: [
        {
          code: `spec:
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        checksum/secret: {{ include (print $.Template.BasePath "/secret.yaml") . | sha256sum }}

# The pod template changes -> a new ReplicaSet -> a normal rolling update.
# Without it the pods keep the old env vars until something else re-rolls them.`,
        },
      ],
    },
    {
      title: 'Debugging a chart',
      snippets: [
        {
          lang: 'shell',
          code: `helm lint ./chart -f values.prod.yaml           # chart hygiene
helm template api ./chart -f values.prod.yaml   # render locally, no cluster needed
helm template api ./chart --show-only templates/deployment.yaml
helm template api ./chart --debug               # + the computed values on stderr
helm install api ./chart --dry-run=server       # render AND validate server-side

# what is actually live
helm get manifest api
helm get values api -a          # -a: including the chart defaults
helm get hooks api
helm history api
helm diff upgrade api ./chart -f values.prod.yaml   # plugin: helm-diff. Install it

# render -> apply by hand when you need to see kubectl's own error
helm template api ./chart | kubectl apply --dry-run=server -f -`,
        },
        {
          note: 'Errors you will hit, and what they mean',
          lang: 'shell',
          code: `"nil pointer evaluating interface {}.x"
  a values key you reference does not exist. Guard it:
  {{ if .Values.foo }} / {{ .Values.foo | default "x" }} / {{ dig "a" "b" "" .Values }}

"error converting YAML to JSON: did not find expected key"
  indentation. Run helm template and look at the rendered line it names.

"UPGRADE FAILED: another operation (install/upgrade/rollback) is in progress"
  a previous run died. helm rollback api <last good>, or if it never installed:
  helm uninstall api

"cannot patch ...: field is immutable"
  selectors, StatefulSet volumeClaimTemplates and jobs cannot change in place.
  Delete and recreate that resource.

"release: already exists"
  helm upgrade --install, or uninstall the orphaned release first.

"Error: INSTALLATION FAILED: ... exists and cannot be imported"
  the object was created outside Helm. Adopt it with the ownership labels:
  meta.helm.sh/release-name, meta.helm.sh/release-namespace, app.kubernetes.io/managed-by=Helm`,
        },
      ],
    },
    {
      title: 'Packaging & publishing',
      snippets: [
        {
          lang: 'shell',
          code: `helm package ./chart                  # -> api-1.4.0.tgz
helm package ./chart --version 1.4.1 --app-version 2.7.2

# classic HTTP repo (e.g. GitHub Pages)
helm repo index . --url https://me.github.io/charts
# commit index.yaml + the .tgz files

# OCI registry — the modern way, same place as your images
helm push api-1.4.0.tgz oci://ghcr.io/me/charts
helm install api oci://ghcr.io/me/charts/api --version 1.4.0
helm show values oci://ghcr.io/me/charts/api --version 1.4.0
helm pull oci://ghcr.io/me/charts/api --version 1.4.0 --untar

# signing
helm package ./chart --sign --key 'me@example.com' --keyring ~/.gnupg/secring.gpg
helm verify api-1.4.0.tgz`,
        },
        {
          note: 'values.schema.json — fail fast on a bad value',
          code: `{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["image"],
  "properties": {
    "replicaCount": { "type": "integer", "minimum": 1 },
    "image": {
      "type": "object",
      "required": ["repository"],
      "properties": {
        "repository": { "type": "string" },
        "pullPolicy": { "enum": ["Always", "IfNotPresent", "Never"] }
      }
    }
  }
}`,
          lang: 'javascript',
        },
      ],
    },
    {
      title: 'In CI, and secrets',
      snippets: [
        {
          lang: 'shell',
          code: `# a deploy step that cannot leave the cluster half-broken
helm upgrade --install api ./chart \\
  --namespace payments --create-namespace \\
  -f values.prod.yaml \\
  --set image.tag="$GIT_SHA" \\
  --atomic --timeout 10m \\
  --wait

helm test api --logs

# lint every chart on every PR
helm lint ./chart
ct lint --target-branch main        # chart-testing
helm unittest ./chart               # plugin: helm-unittest, real assertions on output`,
        },
        {
          note: 'Do not put secrets in values.yaml',
          lang: 'shell',
          code: `# bad: values.prod.yaml with a real password, committed to git

# 1. helm-secrets + SOPS: encrypted values file, decrypted at deploy time
helm secrets upgrade api ./chart -f secrets.prod.yaml

# 2. external-secrets / sealed-secrets: the chart renders a reference,
#    the operator fetches the real value from Vault / AWS / GCP

# 3. --set from the CI secret store (it lands in the release Secret, so the
#    cluster still holds it in plain base64 — fine for many teams, not all)
helm upgrade api ./chart --set db.password="$DB_PASSWORD"

# remember: helm get values api  prints everything back out.`,
        },
      ],
    },
    {
      title: 'Common mistakes',
      snippets: [
        {
          lang: 'shell',
          code: `no --version on install     -> a different chart ships to prod next week
no --atomic                 -> a failed upgrade leaves half the release broken
randAlphaNum in a Secret    -> a new password on EVERY upgrade. Use lookup, or an operator
--reuse-values everywhere   -> values drift until nobody knows what is set
version in selectorLabels   -> immutable field, upgrades fail forever after
template instead of include -> you cannot pipe it, so you cannot nindent it
"." inside range            -> it is the ITEM, not the root. Use $ for the root
indent where nindent is meant -> YAML that is off by one level, silently wrong
hook-delete-policy missing  -> "job already exists" on the second upgrade
CRDs in templates/          -> ordering races. Put them in crds/ (never upgraded)
no checksum/config annotation -> config changes that nothing ever picks up
editing resources with kubectl -> the next helm upgrade reverts them
chart version not bumped    -> the registry serves the old one from cache`,
        },
      ],
    },
  ],
}

export default helm
