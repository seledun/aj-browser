## The project
This repo contains the web view part of the bland.video archival project.

### Pre-requisites
Node.js, v24 seems the most stable with Prisma.

### Instructions
1. You need to supply a database file to use the web view, these can be found on bland.video/backups (wip)
2. The store.db file needs to be placed into the prisma folder of the project
3. Run the following commands:
`npm install`
`npx prisma generate`
`npm run build`
`npm run start`

You can now use the webviewer at the URL listed in the command window.
