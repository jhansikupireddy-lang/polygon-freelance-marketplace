---
description: how to deploy PolyLance to production
---

# PolyLance Production Deployment Guide

Follow these steps to deploy the full PolyLance stack to production.

## 1. Smart Contract Deployment (Polygon Mainnet)

1.  Navigate to the `contracts` directory.
2.  Ensure your `.env` has a `PRIVATE_KEY` with real MATIC.
// turbo
3.  Run the deployment script:
    ```bash
    npx hardhat run scripts/deploy_mainnet.js --network polygon
    ```
4.  Copy the `FreelanceEscrow` address and update `frontend/src/constants.js`.

## 2. Backend Deployment (Railway/Render)

1.  Connect your GitHub repo to **Railway.app**.
2.  Set the following **Environment Variables**:
    *   `PORT`: `3001`
    *   `MONGODB_URI`: Your MongoDB Atlas URL.
    *   `FRONTEND_URL`: `https://your-app.vercel.app`
3.  Deploy.

## 3. Frontend Deployment (Vercel)

1.  Connect your GitHub repo to **Vercel**.
2.  Set the following **Environment Variables**:
    *   `VITE_API_BASE_URL`: `https://your-backend.railway.app/api`
    *   `VITE_WALLETCONNECT_PROJECT_ID`: Your project ID.
    *   `VITE_ALCHEMY_ID`: Your Alchemy ID.
3.  Vercel will automatically build and host the app.

---

// turbo
## 4. Local Production Test
To test the build locally:
```bash
cd frontend
npm run build
npm run preview
```
