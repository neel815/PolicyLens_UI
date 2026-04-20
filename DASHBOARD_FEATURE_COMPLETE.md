# Dashboard Feature Implementation - Complete

## Overview
Comprehensive Dashboard feature added to PolicyLens, allowing users to view all analyzed policies, access detailed analysis, manage simulations, and delete policies.

## New Files Created

### Frontend
1. **`frontend/app/dashboard/policy/[id]/page.tsx`**
   - Policy detail page showing complete analysis and simulation history
   - Displays score breakdown, covered events, exclusions, and risky clauses
   - Shows full JSONB AI analysis if available
   - Simulation history sidebar with results
   - Action buttons: Run Simulation, Delete
   - Responsive layout (3 columns → 1 column on mobile)

### Backend

2. **`backend/app/models/claim_simulation.py`**
   - New SQLAlchemy model for storing policy claim simulations
   - Fields: `id`, `policy_id` (FK), `scenario`, `coverage_result`, `explanation`, timestamps
   - Relationships: back_populates to Policy for cascade delete on policy removal

3. **`backend/services/claim_simulation_service.py`**
   - Service layer for simulation management
   - Functions:
     - `create_claim_simulation()` - Save simulation to database
     - `get_policy_simulations()` - Retrieve all simulations for a policy
     - `delete_simulation()` - Remove a simulation record

4. **`backend/alembic/versions/004_add_claim_simulations.py`**
   - Database migration creating `claim_simulations` table
   - Includes FK constraint on `policies.id` with proper indexing
   - Creates index on `policy_id` for efficient queries

## Modified Files

### Frontend Changes

1. **`frontend/app/dashboard/page.tsx`**
   - Updated policy cards to use Link to `/dashboard/policy/{id}`
   - Converts card div to Link component while preserving interactions
   - Delete and Simulate buttons use `event.preventDefault()` to avoid navigation
   - Dashboard already had complete implementation with stats, grid layout, and empty state

### Backend Changes

1. **`backend/app/models/policy.py`**
   - Added relationship: `simulations = relationship("ClaimSimulation", back_populates="policy", cascade="all, delete-orphan")`
   - Enables cascade delete - removes simulations when policy is deleted

2. **`backend/routes/simulate_routes.py`**
   - Updated `SimulateRequest` model to include optional `policy_id: int | None = None`
   - Added POST endpoint parameters: `db: Session = Depends(get_db)`
   - Added GET endpoint: `/policies/{policy_id}/simulations`
     - Returns array of simulations with id, policy_id, scenario, coverage_result, explanation, created_at
     - Requires authentication via `get_current_user_id`

3. **`backend/controllers/simulate_controller.py`**
   - Updated `simulate_claim_controller()` signature to accept `policy_id` and `db`
   - Added call to `create_claim_simulation()` after successful simulation
   - Sets `coverage_result` based on verdict ("Likely Approved" or "Partial Coverage" = True)
   - Non-blocking error handling - failures to save don't break simulation functionality

4. **`frontend/app/simulate/page.tsx`**
   - Updated fetch body to include `policy_id: selectedPolicy.id`
   - Passed to backend to enable simulation persistence

## Database Schema

### New Table: `claim_simulations`
```sql
CREATE TABLE claim_simulations (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    policy_id INTEGER NOT NULL,
    scenario TEXT NOT NULL,
    coverage_result BOOLEAN NOT NULL,
    explanation TEXT NOT NULL,
    FOREIGN KEY (policy_id) REFERENCES policies(id)
);

CREATE INDEX ix_claim_simulations_policy_id ON claim_simulations(policy_id);
```

## API Endpoints

### New Endpoint
- **GET** `/api/policies/{policy_id}/simulations`
  - Returns all simulations for a specific policy
  - Requires authentication
  - Response: Array of simulation objects
  ```json
  [
    {
      "id": 1,
      "policy_id": 5,
      "scenario": "Hospitalization...",
      "coverage_result": true,
      "explanation": "...",
      "created_at": "2026-04-06T10:30:00"
    }
  ]
  ```

### Modified Endpoint
- **POST** `/api/simulate-claim` 
  - Now accepts `policy_id` in request body
  - Stores simulation result after Gemini analysis
  ```json
  {
    "scenario": "...",
    "policy_id": 5,
    "analysis": { ... }
  }
  ```

## Feature Flow

### User Journey
1. User navigates to `/dashboard`
2. Dashboard displays all analyzed policies in grid
3. User clicks policy card → navigates to `/dashboard/policy/{id}`
4. Detail page shows:
   - Complete analysis breakdown
   - Covered events with green checkmarks
   - Exclusions with red X marks
   - Risky clauses with warning icons
   - Full JSONB AI analysis (if available)
   - Sidebar with all simulations run for this policy
5. User can:
   - Run new simulation → `/simulate?id={id}`
   - View simulation history with results and explanations
   - Delete policy (with confirmation)

### Simulation Persistence
1. User runs simulation on `/simulate` page
2. Frontend sends POST to `/api/simulate-claim` with `policy_id`
3. Backend:
   - Gets Gemini analysis
   - Calls `create_claim_simulation()` to save result
   - Returns analysis to frontend
4. User navigates back to policy detail
5. Dashboard fetches `/api/policies/{id}/simulations`
6. Simulations display with verdicts and explanations

## Prerequisites for Running

### Run Database Migration
```bash
cd backend
alembic upgrade head
```

This will create the `claim_simulations` table and set up the foreign key relationships.

## Design Consistency

- Uses existing color scheme: #F7F6F2 (bg), #1A3FBE (accent)
- Font families: var(--font-serif) for headings, var(--font-sans) for body
- Icons for score indicators: green (covered), red (excluded), yellow (risky)
- Responsive layout: 1 column mobile, 3 columns desktop
- Consistent shadow and rounded corner styling from design system

## Testing Checklist

- [ ] Run migration: `alembic upgrade head`
- [ ] Create a policy via `/` upload
- [ ] Navigate to `/dashboard` - should see policy card
- [ ] Click card → `/dashboard/policy/{id}` loads correctly
- [ ] Simulate page shows correct policy selected
- [ ] Run simulation → results displayed immediately
- [ ] Refresh page → simulations persist in sidebar
- [ ] Delete simulation record from DB manually (optional)
- [ ] Delete policy → cascade deletes simulations

## Notes

- Simulations are stored but not deleted via UI (only via policy deletion cascade)
- Error handling in simulate_controller is non-blocking (console logs only)
- Frontend simulation history panel has scrollable max-height to prevent layout shift
- All endpoints require user authentication
