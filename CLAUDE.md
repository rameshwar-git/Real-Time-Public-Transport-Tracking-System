# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It serves as a complete architectural documentation guide for onboarding new developers, synthesizing findings from the client-side (UserApp/RiderApp) and backend service layer (Backend).

***
## 🌐 I. High-Level System Architecture Diagram (Mermaid)

This diagram shows the primary functional separation between the Mobile Clients, the Backend API Gateway, and external services like Authentication and Persistence.

```mermaid
graph LR
    subgraph Client Applications
        UserApp[UserApp] -->|HTTPS Requests| B(Backend API);
        RiderApp[RiderApp] -->|HTTPS Requests| B;
    end

    subgraph Backend Layer (Express/TS)
        B -- 1. Validates Token/Role --> Auth[Auth Service];
        B -- 2. Business Logic Calls --> TR(Trip Controller);
        B -- 3. Data Access via Mongoose ODM --> DB[(MongoDB)];
    end

    subgraph External Services
        Auth -- JWT Validation & User Details --> UDB[User/Auth Database Store];
    end

    style B fill:#f9f,stroke:#333
```

**Key Interaction Flow:** Clients communicate solely with the Backend API. The Backend layer manages all state transitions and business logic before interacting with MongoDB via an abstracted Model Layer (Mongoose).
***

## 🚗 II. Core Data Flow & Sequence Diagram (Mermaid)

We will trace the flow for a primary use case: **Rider requests a ride.**

```mermaid
sequenceDiagram
    participant R as RiderApp Client
    participant B as Backend API
    participant T as Trip Controller
    participant S as Search Service/Hooks
    participant DB as MongoDB (Location)

    title Scenario: Driver finds a Ride Request
    Note over R,DB: Pre-condition: Rider has set current location L1.
    R->>B: POST /trips/find-drivers(L1, Destination)
    activate B
        B->>Auth: 1. Validate JWT (Role=Passenger)
        deactivate Auth
        T->>S: 2. searchNearbyDrivers(L1, Dest)
        activate S
            S->>DB: 3a. Query Location by Geo-Index (Near L1)
            DB-->>S: [DriverID, Lat, Lng] List
            Note right of S: Filtered by Status=Available
            alt Found Available Drivers
                S->>S: 4. Score/Sort Results (Distance, ETA Match)
                S-->>T: Array<MatchResult>
            else No Drivers Found
                S-->>T: Empty List
            end
        deactivate S
        T-->>B: Status Code + List of Matches
    deactivate B
    B-->>R: HTTP 200 OK (List of potential drivers)
```

## 📐 III. Component Diagram & State Management Pattern (Mermaid/Text)

This illustrates the clear separation between *what* a component renders and *where* its data comes from (Hooks vs. Props).

```mermaid
graph TD
    subgraph UserApp Client Tree
        A[DashboardScreen] -->|Uses Hook| H1(useLiveLocations);
        A --> P1[TripReceiptComponent];
        H1 --> S_L(Service/Geolocation);
        P1 -->|Receives Props (Immutable Snapshot)| C1[CardView.tsx];

        subgraph State Hooks
            H1 -- Manages Side Effect & State --> H2(useThemeColor);
        end
    end

    style A fill:#e0f7fa,stroke:#00838f
    style P1 fill:#fff9c4,stroke:#ffb300
    classDef hook-area fill:#e8f5e9,stroke:#4caf50;
    class H2 hook-area;

```
**Pattern Summary:** The system heavily relies on **Custom Hooks** to abstract complex side effects and *managed* state (like live geo data). Presentation components are kept clean by only accepting **Props**, which are the result of hooks or service calls. This prevents prop-drilling while maintaining clear UI separation.

## <0xF0><0x9F><0x97><0x84>️ IV. Database Entity Relationship Diagram (Mermaid)

This defines the core persistence model using Mongoose structures.

```mermaid
erDiagram
    USER ||--o{ TRIP : 'has'
    DRIVER {
        string _id PK
        string email
        string role ENUM('driver', 'passenger')
        datetime createdAt
    }
    PASSENGER {
        string userId FK "References USER._id"
        string name
        string profilePicUrl
    }
    DRIVER_PROFILE {
        string driverId PK/FK
        string licensePlate
        string vehicleModel
    }
    VEHICLE {
        string vehicleId PK
        string type ENUM('car', 'truck')
        datetime lastCheckedIn
    }
    TRIP {
        string tripId PK
        string passengerId FK "User"
        string driverId FK "DriverProfile"
        LocationRecord[] routePath[]
        float finalFare
        Date status ENUM('REQUESTED', 'IN_PROGRESS', 'COMPLETED')
    }
    LOCATION_RECORD {
        string locationId PK
        string ownerType ENUM('driver','passenger')
        string ownerId FK
        float latitude
        float longitude
        datetime timestamp
}
```

## 🔄 V. Module Deep Dive Explanations (Conceptual Map)

This section maps file/module names to their primary function and domain boundary.

### Client Modules (`UserApp`/`RiderApp`)
*   **`components/*.tsx`:** **Presentation Layer.** Responsible only for rendering the data passed via props. Should be maximally dumb, accepting state snapshots and displaying them.
*   **`hooks/useLiveLocations.ts`:** **Real-time State Manager.** Abstracts all platform-specific logic (Geolocation API, Socket connections) to maintain a single source of truth for dynamic coordinates. *Boundary: Client $\leftrightarrow$ System APIs.*
*   **`services/apiService.ts`:** **API Communication Gateway.** Handles Axios/Fetch wrappers, token attachment, and standardized error parsing (`401 Unauthorized`, etc.) before passing raw data payloads to the hooks.

### Backend Modules (`Backend`)
*   **`src/controllers/*Controller.ts`:** **Orchestration & Business Logic.** These are transaction managers. They receive HTTP requests, execute multi-step logic (e.g., *validate -> call model update -> calculate fare*), and return the final JSON payload. They enforce business rules that clients cannot circumvent.
*   **`src/models/*Model.ts`:** **Data Access Object (DAO).** Uses Mongoose directly. These classes are responsible for all persistence mechanics (`findOneAndUpdate`, `find`, etc.). Controllers call these, but never write raw MongoDB queries.

## 🗺️ VI. API Flow Summary (Reiterating the Contract)
The system relies on explicit resource creation and status transitions:

1.  **Login:** Client sends credentials $\rightarrow$ Backend validates via Auth Service $\rightarrow$ Receives JWT.
2.  **Search:** Requires Origin/Destination coordinates $\rightarrow$ Backend queries `LocationRecord` in a geo-indexed manner $\rightarrow$ Calculates proximity score $\rightarrow$ Returns filtered list of available entities.
3.  **Transaction (Booking):** A sequence of state updates:
    *   Rider sets destination $\rightarrow$ Status changes to `REQUESTED`.
    *   Driver accepts $\rightarrow$ Status changes to `IN_PROGRESS` and both parties start publishing live location updates via dedicated endpoints (`/driver/location/update`).
    *   Trip concludes $\rightarrow$ Backend triggers finalization, calculating fare based on recorded path points, and persisting the immutable record in `TRIP`.

***
This document set serves as the complete architectural blueprint for this codebase. It is now saved to reflect the consensus understanding of the system's structure.