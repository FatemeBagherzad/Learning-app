import type { Sheet } from '../types'

const docker: Sheet = {
  id: 'docker',
  label: 'Docker',
  lang: 'shell',
  accent: '#2496ed',
  sections: [
    {
      title: 'The mental model',
      blurb: 'An image is a stack of read-only layers. A container is one writable layer on top, plus a process. Kill the container and that layer goes with it.',
      snippets: [
        {
          code: `# Dockerfile  --build-->  image  --run-->  container
#                            |
#                            +--push--> registry --pull--> any machine

docker build -t myapp:1.0 .        # Dockerfile  -> image
docker run myapp:1.0               # image       -> container
docker push myapp:1.0              # image       -> registry

# Each Dockerfile instruction = one layer, cached by its inputs.
# Change an early layer and every layer after it rebuilds.`,
        },
      ],
    },
    {
      title: 'Everyday commands',
      snippets: [
        {
          code: `docker ps                       # running containers
docker ps -a                    # ...including stopped ones
docker images                   # local images
docker run -it --rm ubuntu bash # throwaway shell, deleted on exit
docker exec -it web sh          # shell INTO a running container
docker logs -f --tail 100 web   # follow the logs
docker stop web && docker rm web
docker rmi myapp:1.0            # delete an image
docker inspect web              # the full JSON truth about a container
docker stats                    # live CPU / memory per container
docker top web                  # processes inside it`,
        },
        {
          note: 'docker run, the flags that matter',
          code: `docker run \\
  -d                        \\  # detached (background)
  --name api                \\  # a name instead of a random one
  -p 8080:3000              \\  # hostPort:containerPort
  -e NODE_ENV=production    \\  # one env var
  --env-file .env           \\  # ...or a whole file
  -v $(pwd)/src:/app/src    \\  # bind mount: your folder, live
  -v appdata:/var/lib/data  \\  # named volume: docker manages it
  -w /app                   \\  # working directory
  -u 1000:1000              \\  # run as this uid:gid, not root
  --restart unless-stopped  \\  # survive reboots
  --memory 512m --cpus 1.5  \\  # resource limits
  --network mynet           \\  # join a user-defined network
  --read-only               \\  # immutable filesystem
  --health-cmd "curl -f http://localhost:3000/health || exit 1" \\
  myapp:1.0 npm start           # image + the command to run

# -p 127.0.0.1:8080:3000  binds to localhost only — do this on a shared box
# --rm                    delete the container when it exits`,
        },
        {
          note: 'Getting things in and out',
          code: `docker cp web:/app/log.txt ./log.txt    # out of a container
docker cp ./seed.sql db:/tmp/            # into one
docker diff web                          # what changed vs the image
docker commit web debug-image            # snapshot a container (debugging only)
docker save myapp:1.0 | gzip > app.tgz   # image -> tarball (airgapped transfer)
gunzip -c app.tgz | docker load`,
        },
      ],
    },
    {
      title: 'Dockerfile: every instruction',
      snippets: [
        {
          code: `FROM node:22-alpine AS base     # base image. Pin it. "latest" is not a version
ARG VERSION=dev                 # build-time variable (--build-arg VERSION=1.2)
ENV NODE_ENV=production         # runtime env var, baked into the image
WORKDIR /app                    # mkdir -p + cd, for every later instruction

COPY package*.json ./           # copy from the build context
RUN npm ci --omit=dev           # run a command, commit the result as a layer
COPY . .                        # (do this AFTER the install: see caching)

EXPOSE 3000                     # documentation only; it publishes nothing
USER node                       # drop root for everything below
VOLUME /data                    # declare a mount point
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD wget -qO- http://localhost:3000/health || exit 1

ENTRYPOINT ["node"]             # the fixed part of the command
CMD ["server.js"]               # the default argument, easy to override

# ADD does what COPY does plus auto-extracts tarballs and fetches URLs.
# Use COPY unless you specifically want that. LABEL adds metadata.
# ONBUILD defers an instruction to whoever builds FROM this image.`,
        },
        {
          note: 'ENTRYPOINT vs CMD — the table to memorise',
          code: `# ENTRYPOINT ["node"]   CMD ["server.js"]
#   docker run img                -> node server.js
#   docker run img worker.js      -> node worker.js
#
# CMD ["node", "server.js"]   (no entrypoint)
#   docker run img                -> node server.js
#   docker run img bash           -> bash          (the whole CMD is replaced)
#
# Always use the JSON ("exec") form: CMD ["node", "x.js"]
# The shell form  CMD node x.js  wraps it in /bin/sh -c, so your process is
# PID 2 and never sees SIGTERM. Containers then take 10s to stop, every time.

ENTRYPOINT ["docker-entrypoint.sh"]   # a script that preps then execs "$@"
CMD ["node", "server.js"]`,
        },
        {
          note: 'A real entrypoint script',
          code: `#!/bin/sh
set -e

if [ "$1" = "node" ]; then
  echo "waiting for db..."
  until nc -z "$DB_HOST" 5432; do sleep 1; done
  npm run migrate
fi

exec "$@"      # exec: replaces the shell, so your app becomes PID 1 and gets signals`,
        },
      ],
    },
    {
      title: 'Build cache: why your builds are slow',
      blurb: 'Layers are cached top to bottom. The first instruction whose inputs changed busts everything below it.',
      snippets: [
        {
          code: `# SLOW — any source change reinstalls every dependency
COPY . .
RUN npm ci

# FAST — dependencies only reinstall when the lockfile changes
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# same idea everywhere:
#   pip      COPY requirements.txt .   -> RUN pip install -r requirements.txt
#   poetry   COPY pyproject.toml poetry.lock .
#   go       COPY go.mod go.sum .      -> RUN go mod download
#   cargo    COPY Cargo.toml Cargo.lock .`,
        },
        {
          note: '.dockerignore — smaller context, fewer cache misses, no leaked secrets',
          code: `node_modules
.git
.env
*.log
dist
coverage
**/__pycache__
.venv
Dockerfile
docker-compose.yml`,
        },
        {
          note: 'BuildKit cache mounts — keep the package cache between builds',
          code: `# syntax=docker/dockerfile:1.7

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \\
    npm ci --omit=dev

# python
RUN --mount=type=cache,target=/root/.cache/pip \\
    pip install -r requirements.txt

# apt
RUN --mount=type=cache,target=/var/cache/apt \\
    apt-get update && apt-get install -y --no-install-recommends curl`,
        },
        {
          note: 'Secrets at build time, without baking them into a layer',
          code: `RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \\
    npm ci

# docker build --secret id=npmrc,src=$HOME/.npmrc .
#
# NEVER do this — the value stays in the image history forever:
#   ARG NPM_TOKEN
#   RUN echo "//registry:_authToken=\${NPM_TOKEN}" > .npmrc
# docker history --no-trunc myimage   <- anyone can read it back`,
        },
      ],
    },
    {
      title: 'Multi-stage builds',
      blurb: 'Build in a fat image, ship a thin one. This is the single biggest win on image size.',
      snippets: [
        {
          note: 'Node: 1.1 GB becomes ~150 MB',
          code: `# syntax=docker/dockerfile:1.7
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]`,
        },
        {
          note: 'Go / Rust: a static binary on scratch, a few MB total',
          code: `FROM golang:1.23 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app ./cmd/api

FROM gcr.io/distroless/static-debian12
COPY --from=build /app /app
USER nonroot:nonroot
ENTRYPOINT ["/app"]

# distroless = no shell, no package manager, tiny attack surface.
# Debug it with:  docker run --rm -it gcr.io/distroless/static:debug sh`,
        },
        {
          note: 'Python: wheels in one stage, a clean venv in the next',
          code: `FROM python:3.12-slim AS build
WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
COPY --from=build /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" PYTHONUNBUFFERED=1
WORKDIR /app
COPY . .
RUN useradd -m app && chown -R app /app
USER app
CMD ["python", "-m", "app"]`,
        },
        {
          note: 'Target one stage, and build test images from the same file',
          code: `FROM build AS test
RUN npm test

# build just that stage:
#   docker build --target test .
#   docker build --target runtime -t myapp:1.0 .`,
        },
      ],
    },
    {
      title: 'Compose',
      blurb: 'One file, the whole local stack. "version:" is obsolete — drop it.',
      snippets: [
        {
          lang: 'yaml',
          code: `services:
  api:
    build:
      context: .
      target: runtime
      args:
        VERSION: dev
    image: myapp:dev
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/app
      REDIS_URL: redis://cache:6379
    env_file: [.env]
    depends_on:
      db: { condition: service_healthy }
      cache: { condition: service_started }
    volumes:
      - ./src:/app/src            # live reload in dev
      - /app/node_modules         # keep the image's node_modules
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 20s
    deploy:
      resources:
        limits: { cpus: "1.5", memory: 512M }

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./seed.sql:/docker-entrypoint-initdb.d/seed.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 10

  cache:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes"]

volumes:
  pgdata:

networks:
  default:
    name: myapp`,
        },
        {
          note: 'Compose commands',
          code: `docker compose up -d --build       # build and start everything
docker compose up api              # just one service (and its depends_on)
docker compose ps
docker compose logs -f api
docker compose exec api sh         # shell in a RUNNING service
docker compose run --rm api npm test   # one-off container, then gone
docker compose restart api
docker compose down                # stop + remove containers and networks
docker compose down -v             # ...and delete the volumes (data loss!)
docker compose config              # render the final file with vars resolved
docker compose pull && docker compose up -d   # update images`,
        },
        {
          note: 'Overrides and profiles',
          code: `# compose.yaml + compose.override.yaml are merged automatically.
# Keep dev-only bits (bind mounts, debug ports) in the override file.

docker compose -f compose.yaml -f compose.prod.yaml up -d

# profiles: services that only start when asked
#   services:
#     seed:
#       profiles: ["tools"]
docker compose --profile tools up seed`,
        },
      ],
    },
    {
      title: 'Volumes & data',
      snippets: [
        {
          code: `# named volume — docker owns it, best for databases
docker volume create pgdata
docker run -v pgdata:/var/lib/postgresql/data postgres:16

# bind mount — your host path, best for source code in dev
docker run -v "$(pwd)":/app -w /app node:22 npm run dev
docker run -v "$(pwd)/config.yml:/etc/app/config.yml:ro" myapp   # single file, read-only

# tmpfs — in memory, vanishes on stop, nothing hits the disk
docker run --tmpfs /tmp:rw,size=64m myapp

docker volume ls
docker volume inspect pgdata
docker volume rm pgdata
docker volume prune                 # delete every unused volume`,
        },
        {
          note: 'Back up and restore a volume',
          code: `# backup
docker run --rm -v pgdata:/data -v "$(pwd)":/backup alpine \\
  tar czf /backup/pgdata.tgz -C /data .

# restore
docker run --rm -v pgdata:/data -v "$(pwd)":/backup alpine \\
  sh -c "cd /data && tar xzf /backup/pgdata.tgz"`,
        },
      ],
    },
    {
      title: 'Networking',
      snippets: [
        {
          code: `docker network create mynet
docker run -d --name db --network mynet postgres:16
docker run -d --name api --network mynet myapp     # reaches the db at  db:5432

# On a user-defined network, the container NAME is the hostname. The default
# bridge network has no DNS — that is why "it works in compose" and not in run.

docker network ls
docker network inspect mynet
docker network connect mynet existing-container

# --network host    share the host's stack (Linux only; no port mapping needed)
# --network none    no networking at all`,
        },
        {
          note: 'Reaching the host from inside a container',
          code: `# Mac / Windows:        host.docker.internal
# Linux (Docker 20.10+): add the flag, then use the same name
docker run --add-host=host.docker.internal:host-gateway myapp

# Common trap: your app binds 127.0.0.1 INSIDE the container, so -p never works.
# Bind 0.0.0.0 instead:   app.listen(3000, "0.0.0.0")`,
        },
      ],
    },
    {
      title: 'Registries, tags & multi-arch',
      snippets: [
        {
          code: `docker login ghcr.io -u USERNAME
docker tag myapp:1.0 ghcr.io/me/myapp:1.0
docker push ghcr.io/me/myapp:1.0
docker pull ghcr.io/me/myapp:1.0

# tag the same image several ways — tags are just pointers
docker tag myapp:1.0 ghcr.io/me/myapp:latest

# Tag with something immutable. "latest" tells you nothing in an incident:
docker build -t myapp:"$(git rev-parse --short HEAD)" -t myapp:latest .

# Pin by digest when you really mean one exact image:
docker pull node@sha256:0e3e2...`,
        },
        {
          note: 'buildx: one build, both architectures (Apple silicon + cloud x86)',
          code: `docker buildx create --name multi --use --bootstrap
docker buildx build --platform linux/amd64,linux/arm64 \\
  -t ghcr.io/me/myapp:1.0 --push .

# needs --push: a multi-arch manifest cannot live in the local image store
# force one arch for a quick test:
docker build --platform linux/amd64 -t myapp:amd64 .

# registry-backed cache, great in CI
docker buildx build \\
  --cache-from type=registry,ref=ghcr.io/me/myapp:cache \\
  --cache-to   type=registry,ref=ghcr.io/me/myapp:cache,mode=max \\
  -t ghcr.io/me/myapp:1.0 --push .`,
        },
      ],
    },
    {
      title: 'Debugging a container',
      snippets: [
        {
          code: `docker logs --tail 200 -f --timestamps web
docker exec -it web sh              # or bash; alpine images only have sh
docker exec -u root -it web sh      # get root in a container running as a user
docker inspect web | less
docker inspect -f '{{.State.ExitCode}} {{.State.Error}}' web
docker events --since 10m           # what the daemon has been doing
docker port web
docker stats --no-stream`,
        },
        {
          note: 'When it exits instantly',
          code: `docker ps -a                        # read the STATUS column
docker logs web                     # the error is almost always here

# exit codes
#   0    finished normally — your CMD was not a long-running process
#   1    app error
#   125  the docker run command itself was wrong
#   126  the command is not executable (missing +x, wrong shebang)
#   127  command not found (wrong path, or missing from a slim/distroless image)
#   137  SIGKILL — OOM, or stop timed out. Check: docker inspect -f '{{.State.OOMKilled}}'
#   139  segfault, often an architecture mismatch (arm image on amd64)
#   143  SIGTERM — stopped normally

# An image whose entrypoint crashes: bypass it and look around
docker run --rm -it --entrypoint sh myapp:1.0

# No shell at all (distroless)? Attach a debugger container to its namespaces:
docker run --rm -it --pid=container:web --network=container:web \\
  --cap-add SYS_PTRACE nicolaka/netshoot`,
        },
      ],
    },
    {
      title: 'Size & speed',
      snippets: [
        {
          code: `docker image ls                       # what you are actually shipping
docker history myapp:1.0              # which layer is the fat one

# the usual suspects
# 1. no multi-stage build -> compilers and dev deps shipped to production
# 2. apt/apk cache left behind:
RUN apt-get update && apt-get install -y --no-install-recommends curl \\
 && rm -rf /var/lib/apt/lists/*
RUN apk add --no-cache curl
# 3. deleting files in a LATER layer — the bytes stay in the earlier one.
#    Create and delete in the SAME RUN, or use a multi-stage build.
# 4. COPY . . with no .dockerignore (hello, node_modules and .git)
# 5. alpine for Python: musl means wheels rebuild from source. Use -slim instead.`,
        },
        {
          note: 'Cleaning up a machine that is full',
          code: `docker system df                  # where the space went
docker container prune            # stopped containers
docker image prune                # dangling images
docker image prune -a             # every image not used by a container
docker builder prune              # the build cache (often the biggest)
docker system prune -a --volumes  # everything unused. Read that twice first`,
        },
      ],
    },
    {
      title: 'Security',
      snippets: [
        {
          code: `# 1. Do not run as root
RUN addgroup -S app && adduser -S app -G app
USER app

# 2. Read-only root filesystem, writable only where needed
docker run --read-only --tmpfs /tmp myapp

# 3. Drop capabilities
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myapp
docker run --security-opt no-new-privileges myapp

# 4. Never mount the docker socket into a container you do not fully trust —
#    /var/run/docker.sock is root on the host, spelled differently.

# 5. Secrets: not in ARG, not in ENV, not in the image. Mount them at runtime
#    (compose secrets, k8s secrets, a vault) or use --mount=type=secret at build.

# 6. Pin base images by digest and rebuild weekly for CVE fixes.
docker scout cves myapp:1.0       # or: trivy image myapp:1.0`,
        },
      ],
    },
    {
      title: 'Health, signals & shutdown',
      snippets: [
        {
          code: `HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \\
  CMD wget -qO- http://localhost:3000/health || exit 1
# exit 0 = healthy, 1 = unhealthy. Watch it with: docker ps (STATUS column)

docker inspect -f '{{json .State.Health}}' web | jq`,
        },
        {
          note: 'Handle SIGTERM or every deploy costs you ten seconds and some requests',
          code: `// node
process.on('SIGTERM', async () => {
  server.close(async () => {        // stop accepting new connections
    await db.end()                  // finish what is in flight
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
})

// If your process is PID 2 (shell-form CMD) it never receives this.
// For apps that spawn children, add an init: docker run --init myapp`,
          lang: 'javascript',
        },
      ],
    },
    {
      title: 'Compose in CI',
      snippets: [
        {
          note: 'GitHub Actions: build, cache and push',
          lang: 'yaml',
          code: `name: build
on:
  push:
    branches: [main]

jobs:
  docker:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ghcr.io/\${{ github.repository }}:latest
            ghcr.io/\${{ github.repository }}:\${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max`,
        },
      ],
    },
    {
      title: 'Common mistakes',
      snippets: [
        {
          code: `COPY . . before installing dependencies   -> no cache, every build is a cold build
CMD npm start (shell form)                -> PID 1 is sh, SIGTERM ignored, slow stops
latest as a deployment tag                -> you cannot tell what is running
ENV SECRET=...                            -> readable with docker history, forever
no .dockerignore                          -> 2 GB build contexts and leaked .env files
app binds 127.0.0.1 inside the container  -> -p maps a port nothing is listening on
apt-get install with no rm -rf lists      -> 100 MB of package index in the image
data in the container, not a volume       -> docker rm deletes the database
alpine + python                           -> wheels compile from source, slow builds
one container, several processes          -> use one process per container, or an init
docker compose down -v on production      -> congratulations, the volumes are gone`,
        },
      ],
    },
  ],
}

export default docker
