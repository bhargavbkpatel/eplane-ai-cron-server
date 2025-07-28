# ePlaneAI-Cron-Server

## 🚀 Git Flow Branching Strategy

This repository follows the Git Flow branching model for structured development and release management.

---

### 📂 Branch Overview

- **`main`** — Always stable, production-ready code  
- **`develop`** — Integration branch for ongoing development  
- **`feature/*`** — New features branched from `develop`  
- **`release/*`** — Release prep branches branched from `develop`  
- **`hotfix/*`** — Emergency fixes branched from `main`

---

### 🔁 Workflow

1. **Start a feature**  
   ```bash
   git checkout -b feature/feature-name develop
   ```

2. **Start a release**  
   ```bash
   git checkout -b release/1.2.0 develop
   ```

3. **Start a hotfix**  
   ```bash
   git checkout -b hotfix/1.2.1 main
   ```

4. **Merge flow**
   - Feature → `develop`
   - Release → `main` + `develop`
   - Hotfix → `main` + `develop`

---

### ✅ Best Practices

- Keep feature branches short-lived  
- Use clear, consistent branch names  
- Open pull requests for all merges  
- Tag releases on `main` after merge
