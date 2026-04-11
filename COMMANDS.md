# Project Commands

This document lists common commands used in the Email Queue System project.

## Development

### Run the project in development mode
Watch for changes and restart automatically.
```bash
npm run dev
```

### Type Checking
Check for TypeScript errors without compiling.
```bash
npm run typecheck
```

## Testing

### Run all tests
```bash
npm test
```

### Run specific test files
Example for the SES service tests:
```bash
npm test src/services/ses.service.test.ts
```

### Run tests in watch mode
Useful during active development.
```bash
npm run test:watch
```

## Linting & Formatting

### Check for lint errors
```bash
npm run lint
```

### Fix lint errors automatically
```bash
npm run lint:fix
```

### Format code with Prettier
```bash
npm run format
```

## Build

### Build for production
Generates `dist/` folder with CJS and ESM formats.
```bash
npm run build
```

---

## Environment Configuration
Ensure you have the following in your `.env` file for real SES usage:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
REDIS_URL=redis://localhost:6379
```
