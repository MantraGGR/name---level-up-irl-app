# Design Document

## Overview

The Gamified Productivity App is a full-stack application that combines a Next.js frontend with Three.js 3D rendering, a FastAPI Python backend, and MongoDB database. The system integrates Google Calendar API for schedule analysis and uses AI agents (Gemini) to generate personalized productivity recommendations. The application features a hexagonal 3D interface with avatar customization and RPG-style progression across six life pillars.

## Architecture

### System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js       │    │   FastAPI        │    │   MongoDB       │
│   Frontend      │◄──►│   Backend        │◄──►│   Database      │
│                 │    │                  │    │                 │
│ • React Three   │    │ • AI Agents      │    │ • User Data     │
│   Fiber         │    │ • Google APIs    │    │ • Calendar      │
│ • 3D Interface  │    │ • Authentication │    │ • Assessments   │
│ • Avatar System │    │ • WebSocket      │    │ • XP/Levels     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │              ┌──────────────────┐
         └──────────────►│  External APIs   │
                        │                  │
                        │ • Google Calendar│
                        │ • Google OAuth   │
                        │ • Gemini AI      │
                        └──────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 14+ with TypeScript, React Three Fiber, Drei
- **Backend**: FastAPI with Python 3.11+, Motor (async MongoDB driver)
- **Database**: MongoDB with async operations
- **3D Rendering**: Three.js, React Three Fiber, GLTF/GLB models
- **AI Integration**: Google Gemini API for recommendation generation
- **Authentication**: JWT with Google OAuth 2.0
- **Real-time**: WebSocket connections for calendar sync

## Components and Interfaces

### Frontend Components

#### 3D Interface Layer
```typescript
interface HexagonalInterface {
  renderHexagons(): void;
  handleUserInteraction(event: InteractionEvent): void;
  animateTransitions(): void;
  updateLifePillars(pillarData: LifePillarData[]): void;
}

interface AvatarRenderer {
  loadAvatarModel(gltfPath: string): Promise<void>;
  updateAvatarEquipment(equipment: Equipment[]): void;
  animateAvatar(animation: AnimationType): void;
  renderFaceScan(scanData: FaceScanData): Promise<Avatar>;
}
```

#### UI Components
```typescript
interface AssessmentComponent {
  renderQuestionnaire(type: 'ADHD' | 'Anxiety' | 'Depression'): JSX.Element;
  submitAssessment(responses: AssessmentResponse[]): Promise<void>;
  displayResults(results: AssessmentResults): JSX.Element;
}

interface CalendarIntegration {
  initiateGoogleAuth(): Promise<AuthResult>;
  displayCalendarEvents(events: CalendarEvent[]): JSX.Element;
  showAIRecommendations(recommendations: ActionStep[]): JSX.Element;
}
```

### Backend Services

#### AI Agent Service
```python
class AIAgentService:
    async def analyze_calendar_events(self, events: List[CalendarEvent]) -> List[ActionStep]:
        """Analyze calendar and generate actionable steps"""
        
    async def generate_recommendations(self, 
                                    user_profile: UserProfile,
                                    assessment_results: AssessmentResults) -> List[Recommendation]:
        """Generate personalized recommendations using Gemini AI"""
        
    async def balance_life_pillars(self, current_activities: List[Activity]) -> BalanceReport:
        """Analyze and suggest life pillar balance improvements"""
```

#### Calendar Service
```python
class CalendarService:
    async def authenticate_google_oauth(self, auth_code: str) -> TokenResponse:
        """Handle Google OAuth authentication"""
        
    async def fetch_calendar_events(self, user_id: str, 
                                  start_date: datetime, 
                                  end_date: datetime) -> List[CalendarEvent]:
        """Retrieve calendar events from Google Calendar API"""
        
    async def setup_webhook(self, user_id: str) -> WebhookResponse:
        """Set up real-time calendar change notifications"""
```

#### XP and Progression Service
```python
class ProgressionService:
    async def award_xp(self, user_id: str, pillar: LifePillar, amount: int) -> XPResult:
        """Award experience points for completed activities"""
        
    async def check_level_up(self, user_id: str, pillar: LifePillar) -> LevelUpResult:
        """Check and process level advancement"""
        
    async def update_avatar_equipment(self, user_id: str, new_equipment: Equipment) -> bool:
        """Update avatar based on progression"""
```

## Data Models

### User and Profile Models
```python
class UserProfile(BaseModel):
    user_id: str
    email: str
    google_tokens: Optional[GoogleTokens]
    assessment_results: Dict[str, AssessmentResults]
    life_pillar_levels: Dict[LifePillar, int]
    total_xp: Dict[LifePillar, int]
    avatar_config: AvatarConfiguration
    preferences: UserPreferences
    created_at: datetime
    updated_at: datetime

class AssessmentResults(BaseModel):
    adhd_score: Optional[int]
    anxiety_score: Optional[int]
    depression_score: Optional[int]
    completed_date: datetime
    recommendations: List[str]
```

### Calendar and Activity Models
```python
class CalendarEvent(BaseModel):
    event_id: str
    title: str
    description: Optional[str]
    start_time: datetime
    end_time: datetime
    location: Optional[str]
    attendees: List[str]
    life_pillar_tags: List[LifePillar]

class ActionStep(BaseModel):
    step_id: str
    title: str
    description: str
    estimated_duration: int  # minutes
    life_pillar: LifePillar
    priority: Priority
    xp_reward: int
    due_date: datetime
    completed: bool = False
```

### 3D and Avatar Models
```python
class AvatarConfiguration(BaseModel):
    model_path: str
    face_scan_data: Optional[FaceScanData]
    equipment: List[Equipment]
    animations: List[AnimationConfig]
    customizations: Dict[str, Any]

class Equipment(BaseModel):
    item_id: str
    name: str
    type: EquipmentType
    required_level: Dict[LifePillar, int]
    model_path: str
    unlock_condition: str
```

## Error Handling

### Frontend Error Handling
- **3D Rendering Errors**: Fallback to 2D interface if WebGL fails
- **Network Errors**: Offline mode with cached data and sync on reconnection
- **Authentication Errors**: Clear token storage and redirect to login
- **Performance Issues**: Dynamic quality adjustment for 3D rendering

### Backend Error Handling
```python
class APIErrorHandler:
    async def handle_google_api_errors(self, error: GoogleAPIError) -> ErrorResponse:
        """Handle Google Calendar/OAuth API errors"""
        
    async def handle_ai_service_errors(self, error: AIServiceError) -> ErrorResponse:
        """Handle Gemini AI API errors with fallback recommendations"""
        
    async def handle_database_errors(self, error: DatabaseError) -> ErrorResponse:
        """Handle MongoDB connection and operation errors"""
```

### Error Recovery Strategies
- **Calendar Sync Failures**: Retry with exponential backoff, cache last known state
- **AI Generation Failures**: Use template-based fallback recommendations
- **Database Connectivity**: Implement connection pooling and automatic reconnection
- **3D Model Loading**: Progressive loading with low-poly fallbacks

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Component testing with React Testing Library
- **3D Rendering Tests**: Three.js scene validation and performance benchmarks
- **Integration Tests**: API integration and WebSocket connection testing
- **Visual Regression Tests**: 3D interface consistency across devices

### Backend Testing
- **Unit Tests**: Service layer testing with pytest and async test utilities
- **API Tests**: FastAPI endpoint testing with test client
- **Integration Tests**: Google API integration and MongoDB operations
- **Load Tests**: Performance testing for AI recommendation generation

### End-to-End Testing
- **User Flows**: Complete user journey from onboarding to daily usage
- **Cross-Platform**: Testing across different devices and browsers
- **Performance**: 3D rendering performance and memory usage monitoring
- **Accessibility**: Ensuring interface accessibility despite 3D elements

## Performance Considerations

### 3D Optimization
- **Model Optimization**: Use compressed GLTF/GLB models with texture atlasing
- **Level of Detail**: Implement LOD system for complex 3D scenes
- **Frustum Culling**: Only render visible 3D elements
- **Instancing**: Use instanced rendering for repeated hexagonal elements

### Backend Optimization
- **Async Operations**: Full async/await pattern for all I/O operations
- **Caching**: Redis caching for frequently accessed user data and AI responses
- **Database Indexing**: Optimize MongoDB queries with proper indexing
- **API Rate Limiting**: Implement rate limiting for Google API calls

### Real-time Features
- **WebSocket Management**: Efficient connection pooling and message queuing
- **Calendar Sync**: Debounced updates to prevent excessive API calls
- **Progressive Loading**: Load 3D assets progressively based on user interaction