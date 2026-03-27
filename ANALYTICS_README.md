# FlexiLeave Analytics Dashboard

A comprehensive analytics and insights dashboard for the FlexiLeave application, providing rich visualizations and actionable data for leave management.

## Features

### 📊 Leave Overview Charts
- **Pie Chart**: Leave status breakdown (PENDING, APPROVED, REJECTED, CANCELLED)
- **Bar Chart**: Leave counts by leave type (AnnualLeave, SickLeave, etc.)
- **Line Chart**: Trends of leave requests submitted over time (weekly/monthly)

### 👥 User/Team Statistics
- Number of pending approvals for current user (if they are an approver)
- Total leaves submitted by each subordinate (if manager/admin)
- Department/team analysis with average leaves per employee
- Highlight top leave-heavy departments

### 🔔 Notifications & Quick Actions
- Show number of unread notifications
- Highlight recent leave requests requiring action
- Quick access to analytics dashboard from main dashboards

### 🎨 Visual Design
- Uses tenant colors (primaryColor, secondaryColor) from Tenant model
- Responsive and mobile-friendly charts
- Visually distinct charts with tooltips and labels
- Professional, modern UI design

## Backend Implementation

### API Endpoints

#### `/api/analytics/leave-overview`
Get leave overview statistics for the tenant.

**Query Parameters:**
- `period` (string): Time period for analysis (week, month, quarter, year) - default: "month"

**Response:**
```json
{
  "totalLeaves": 25,
  "pendingCount": 5,
  "approvedCount": 15,
  "rejectedCount": 3,
  "cancelledCount": 2,
  "statusDistribution": [
    { "status": "PENDING", "count": 5, "percentage": 20 },
    { "status": "APPROVED", "count": 15, "percentage": 60 }
  ],
  "leaveTypeDistribution": [
    { "leaveType": "AnnualLeave", "count": 12, "percentage": 48, "color": "#4f46e5" }
  ],
  "tenantColors": {
    "primaryColor": "#4f46e5",
    "secondaryColor": "#7c3aed"
  }
}
```

#### `/api/analytics/leave-trends`
Get leave trends over time.

**Query Parameters:**
- `period` (string): Time period for analysis (week, month, quarter, year) - default: "month"
- `interval` (string): Interval for grouping data (day, week, month) - default: "week"

**Response:**
```json
{
  "trends": [
    { "date": "2023-11-01", "totalRequests": 3, "approvedRequests": 2, "pendingRequests": 1 }
  ],
  "tenantColors": {
    "primaryColor": "#4f46e5",
    "secondaryColor": "#7c3aed"
  }
}
```

#### `/api/analytics/user-stats`
Get user/team statistics for managers and admins.

**Response:**
```json
{
  "pendingApprovals": 8,
  "subordinateStats": [
    {
      "userId": 2,
      "name": "John Doe",
      "email": "john@example.com",
      "totalLeaves": 5,
      "pendingLeaves": 1,
      "approvedLeaves": 3,
      "rejectedLeaves": 1
    }
  ],
  "departmentStats": [
    {
      "department": "Engineering",
      "totalLeaves": 15,
      "employeeCount": 8,
      "avgLeavesPerEmployee": 1.88
    }
  ],
  "tenantColors": {
    "primaryColor": "#4f46e5",
    "secondaryColor": "#7c3aed"
  }
}
```

#### `/api/analytics/notifications`
Get notification statistics.

**Response:**
```json
{
  "unreadCount": 3,
  "recentNotifications": [
    {
      "id": 1,
      "title": "New leave request submitted",
      "message": "John Doe submitted Annual Leave for Nov 15-20",
      "type": "leave_submitted",
      "createdAt": "2023-11-10T10:30:00Z",
      "isRead": false
    }
  ],
  "tenantColors": {
    "primaryColor": "#4f46e5",
    "secondaryColor": "#7c3aed"
  }
}
```

#### `/api/analytics/dashboard-summary`
Get complete dashboard summary for the tenant.

**Query Parameters:**
- `period` (string): Time period for analysis (week, month, quarter, year) - default: "month"

**Response:**
Combines all analytics data into a single response for optimal performance.

### Authentication & Authorization
- All endpoints require valid JWT authentication
- Data is scoped to the authenticated user's tenant
- User stats endpoint only shows data for users the current user can manage
- Admin/manager roles have access to team and department statistics

## Frontend Implementation

### Components

#### `AnalyticsDashboard.jsx`
Main analytics dashboard component with:
- Interactive charts using Recharts
- Filter controls for period and interval
- Responsive grid layout
- Real-time data updates
- Error handling and loading states

#### `analyticsService.js`
Frontend service for API communication:
- Axios instance with proper error handling
- Methods for all analytics endpoints
- Automatic retry logic for failed requests

### Charts and Visualizations

#### Pie Chart (Leave Status Distribution)
- Shows percentage breakdown of leave statuses
- Uses tenant colors for consistent branding
- Interactive tooltips with detailed information

#### Bar Chart (Leave Types Distribution)
- Displays leave counts by type
- Horizontal bars for better readability
- Color-coded by leave type with consistent palette

#### Line Chart (Leave Trends)
- Time-series visualization of leave requests
- Multiple data series (total, approved, pending)
- Date-based x-axis with proper formatting

#### Data Tables
- Team member statistics with leave breakdown
- Department analysis with averages
- Responsive design with scrollable containers

### Responsive Design
- Mobile-first approach with responsive breakpoints
- Charts adapt to container size using ResponsiveContainer
- Touch-friendly interactions on mobile devices
- Optimized layouts for different screen sizes

## Integration

### Dashboard Integration
The analytics dashboard is integrated into existing dashboards:

#### Administrator Dashboard
- Analytics section with quick access button
- Shows pending approvals and team statistics
- Links to full analytics dashboard

#### User Dashboard
- Organization insights for all users
- Team analytics for managers/admins
- Contextual information based on user role

### Navigation
- Direct route to `/analytics` for full dashboard
- Quick links from main dashboards
- Breadcrumb navigation for easy access

## Technology Stack

### Backend
- **Node.js** with **Express**
- **Prisma ORM** for database operations
- **PostgreSQL** database
- **JWT** authentication
- **CORS** configuration for frontend integration

### Frontend
- **React** with functional components
- **Recharts** for data visualization
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Router** for navigation

### Key Features
- **Tenant Scoping**: All data is scoped to the authenticated user's tenant
- **Real-time Updates**: Dashboard updates when data changes
- **Error Handling**: Comprehensive error handling with user feedback
- **Performance**: Optimized queries and efficient data fetching
- **Accessibility**: ARIA labels and keyboard navigation support

## Installation and Setup

### Backend Setup
1. Ensure the analytics routes are registered in `server.js`:
```javascript
const analyticsRoutes = require("./routes/analyticsRoutes");
app.use("/api/analytics", analyticsRoutes);
```

2. Install required dependencies:
```bash
npm install recharts
```

### Frontend Setup
1. Ensure Recharts is installed:
```bash
npm install recharts
```

2. Import the analytics service and dashboard component:
```javascript
import { analyticsService } from "./services/analyticsService";
import AnalyticsDashboard from "./pages/analytics/AnalyticsDashboard";
```

3. Add routing for the analytics dashboard:
```javascript
<Route path="/analytics" element={<AnalyticsDashboard />} />
```

## Usage

### Accessing Analytics
1. **Direct Access**: Navigate to `/analytics` route
2. **From Administrator Dashboard**: Click "View Analytics Dashboard" button
3. **From User Dashboard**: Click "View Team Analytics" or "View Organization Analytics"

### Using Filters
- **Period Filter**: Select time range (Last 7 days, This month, Last quarter, This year)
- **Interval Filter**: Choose data grouping (Daily, Weekly, Monthly)
- **Real-time Updates**: Charts update automatically when filters change

### Interacting with Charts
- **Tooltips**: Hover over chart elements for detailed information
- **Legend**: Click legend items to show/hide data series
- **Responsive**: Charts resize automatically on window resize

## Performance Considerations

### Database Optimization
- Indexes on frequently queried fields (tenantId, status, submittedAt)
- Efficient aggregation queries using Prisma
- Proper date range filtering to limit result sets

### Frontend Optimization
- Lazy loading of chart components
- Efficient state management with minimal re-renders
- Responsive charts that adapt to container size

### Caching Strategy
- Consider implementing Redis caching for frequently accessed analytics data
- Browser caching for static chart configurations
- API response caching for improved performance

## Security

### Data Protection
- All endpoints require authentication
- Data is scoped to tenant level
- No sensitive data exposed in API responses

### Input Validation
- Query parameter validation for period and interval
- Proper error handling for invalid inputs
- SQL injection protection through Prisma ORM

## Future Enhancements

### Potential Features
- **Export Functionality**: PDF/Excel export of charts and data
- **Custom Date Ranges**: User-defined date ranges beyond preset periods
- **Advanced Analytics**: Predictive analytics and trend forecasting
- **Department Filtering**: Filter analytics by specific departments
- **User Role Analytics**: Analytics specific to different user roles

### Performance Improvements
- **Pagination**: For large datasets in tables
- **Virtualization**: For long lists of team members
- **Background Processing**: For complex analytics calculations

## Troubleshooting

### Common Issues
1. **Charts Not Rendering**: Check data format matches Recharts expectations
2. **Authentication Errors**: Verify JWT tokens are being sent correctly
3. **CORS Errors**: Ensure frontend and backend origins are configured
4. **Performance Issues**: Monitor database query performance and add indexes

### Debugging
- Use browser developer tools to inspect API responses
- Check console for JavaScript errors
- Monitor network requests for API call issues
- Verify tenant scoping in database queries

## Contributing

When contributing to this feature:
1. Follow existing code patterns and naming conventions
2. Add appropriate tests for new functionality
3. Update documentation for any API changes
4. Ensure responsive design works across all devices
5. Test with different tenant configurations

## License

This feature is part of the FlexiLeave application and follows the same licensing terms.