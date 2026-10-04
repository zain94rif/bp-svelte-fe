# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@0.17.0 create --template minimal --types ts --add prettier eslint tailwindcss="plugins:typography,forms" --install bun bpjs-fe
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Menjalankan dengan Podman

Frontend berjalan di container pada `http://localhost:4173`. Pilih backend Go
atau Elysia melalui pilihan **Backend** di halaman login atau header aplikasi;
pilihan disimpan di browser dan tidak memerlukan perubahan `.env` maupun rebuild.

| Backend | URL yang dipakai browser |
| ------- | ------------------------ |
| Go      | `http://localhost:8080`  |
| Elysia  | `http://localhost:3080`  |

Dari direktori project, build dan jalankan container:

```sh
podman-compose up --build -d
```

Buka `http://localhost:4173`. Jalankan `podman-tui` di terminal untuk melihat
log/status atau mengelola container `bpjs-fe`. Perintah praktis:

```sh
podman-compose logs -f bpjs-fe
podman-compose down
```

Podman hanya menjalankan FE; kedua backend dan PostgreSQL tetap berjalan di host.
Karena browser mengakses backend langsung, konfigurasi CORS pada Go dan Elysia
harus mengizinkan origin `http://localhost:4173`. Database tetap memakai
konfigurasi backend yang sudah ada, tidak perlu dipindahkan ke Podman.

## Dockerfile untuk Go dan Elysia

Disediakan tiga file untuk dipindahkan ke folder project masing-masing:

- `Dockerfile`: FE SvelteKit, gunakan di folder FE.
- `Dockerfile.go`: Go API, pindahkan ke folder Go dan ubah namanya menjadi `Dockerfile`.
- `Dockerfile.elysia`: Elysia API, pindahkan ke folder Elysia dan ubah namanya menjadi `Dockerfile`.
- Pindahkan juga `.dockerignore.go` dan `.dockerignore.elysia` ke folder BE masing-masing
  dengan nama `.dockerignore`; keduanya mencegah file `.env` lokal masuk ke build context.

Dockerfile Go yang diberikan sudah sesuai sebagai multi-stage build. Pastikan
server Go mendengarkan di `0.0.0.0:8080`, bukan hanya `localhost`, di dalam
container.

Dockerfile Elysia mengasumsikan project menggunakan Bun 1.4, mempunyai `bun.lock`,
dan entrypoint `src/index.ts`. Jika entrypoint atau file lock berbeda, sesuaikan
baris `COPY` dan `CMD` dengan struktur project tersebut.

Jika Compose diletakkan pada folder induk yang berisi `bpjs-fe`, `bpjs-go`, dan
`bpjs-elysia`, salin `compose.stack.example.yaml` ke folder itu dengan nama
`compose.yaml`. Contoh tersebut menganggap ketiga nama folder itu; ubah `context`
jika struktur direktori Anda berbeda.

Sesuaikan nama folder dan tambahkan environment DB sesuai nama konfigurasi yang
dibaca masing-masing BE. Dari dalam container, koneksi PostgreSQL di host Linux
Podman umumnya menggunakan `host.containers.internal:5432` (bukan `localhost`).
PostgreSQL juga harus menerima koneksi dari alamat bridge Podman; periksa
`listen_addresses` dan `pg_hba.conf`. FE di browser tetap menggunakan
`localhost:8080` dan `localhost:3080` dari pemilih backend, sehingga port kedua
BE perlu dipublikasikan seperti pada contoh.
