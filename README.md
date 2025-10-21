# Piko Patisserie & Café

This is a code bundle for Piko Patisserie & Café. The original project is available at https://www.figma.com/design/zULiCzZPIMQ2cdbZQMdaOX/Piko-Patisserie---Caf%C3%A9.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

Additional scripts:

- Generate static menu JSON before build:
  - `npm run build:free-plan`
- Import full menu data from CSV (ESM):
  - `npm run import:menu -- path/to/menu.csv ./images`
- Export current menu to CSV:
  - `npm run export:menu`
