# Analytics Dashboard Test Guide

## Backend API Tests

### 1. Leave Overview Endpoint
```bash
# Test leave overview for current month
curl -X GET "http://localhost:5000/api/analytics/leave-overview?period=month" \
  -H "Cookie: accessToken=your_token_here"

# Test with different periods
curl -X GET "http://localhost:5000/api/analytics/leave-overview?period=week" \
  -H "Cookie: accessToken=your_token_here"
```

### 2. Leave Trends Endpoint
```bash
# Test leave trends with weekly interval
curl -X GET "http://localhost:5000/api/analytics/leave-trends?period=month&interval=week" \
  -H "Cookie: accessToken=your_token_here"
```

### 3. User Stats Endpoint
```bash
# Test user/team statistics
curl -X GET "http://localhost:5000/api/analytics/user-stats" \
  -H "Cookie: accessToken=your_token_here"
```

### 4. Notifications Endpoint
```bash
# Test notification statistics
curl -X GET "http://localhost:5000/api/analytics/notifications" \
  -H "Cookie: accessToken=your_token_here"
```

### 5. Dashboard Summary Endpoint
```bash
# Test complete dashboard summary
curl -X GET "http://localhost:5000/api/analytics/dashboard-summary?period=month" \
  -H "Cookie: accessToken=your_token_here"
```

## Frontend Component Tests

### 1. Analytics Dashboard Component
- Navigate to `/analytics` route
- Verify charts render correctly
- Test period and interval filters
- Check responsive design on mobile devices

### 2. Integration with Existing Dashboards
- Verify analytics links appear in administrator dashboard
- Verify analytics links appear in user dashboard (for managers/admins)
- Test navigation between dashboards

## Expected Response Formats

### Leave Overview Response
```json
{
  "totalLeaves": 25,
  "pendingCount": 5,
  "approvedCount": 15,
  "rejectedCount": 3,
  "cancelledCount": 2,
  "statusDistribution": [
    { "status": "PENDING", "count": 5, "percentage": 20 },
    { "status": "APPROVED", "count": 15, "percentage": 60 },
    { "status": "REJECTED", "count": 3, "percentage": 12 },
    { "status": "CANCELLED", "count": 2, "percentage": 8 }
  ],
  "leaveTypeDistribution": [
    { "leaveType": "AnnualLeave", "count": 12, "percentage": 48, "color": "#4f46e5" },
    { "leaveType": "SickLeave", "count": 8, "percentage": 32, "color": "#ef4444" },
    { "leaveType": "FamilyResponsibility", "count": 5, "percentage": 20, "color": "#10b981" }
  ],
  "tenantColors": {
    "primaryColor": "#4f46e5",
    "secondaryColor": "#7c3aed"
  }
}
```

### Leave Trends Response
```json
{
  "trends": [
    { "date": "2023-11-01", "totalRequests": 3, "approvedRequests": 2, "pendingRequests": 1 },
    { "date": "2023-11-08", "totalRequests": 5, "approvedRequests": 4, "pendingRequests": 1 },
    { "date": "2023-11-15", "totalRequests": 2, "approvedRequests": 1, "pendingRequests": 1 }
  ],
  "tenantColors": {
    "primaryColor": "#4f46e5",
    "secondaryColor": "#7c3aed"
  }
}
```

### User Stats Response
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

## Testing Checklist

- [ ] Backend routes are registered and accessible
- [ ] All analytics endpoints return correct data format
- [ ] Tenant colors are properly applied
- [ ] Charts render correctly with Recharts
- [ ] Responsive design works on mobile devices
- [ ] Filters (period, interval) work correctly
- [ ] Error handling displays appropriate messages
- [ ] Authentication and authorization work correctly
- [ ] Integration with existing dashboard components
- [ ] Performance is acceptable with large datasets

## Common Issues and Solutions

1. **CORS Errors**: Ensure frontend and backend origins are properly configured
2. **Authentication Errors**: Verify JWT tokens are being sent correctly
3. **Chart Rendering Issues**: Check that data format matches Recharts expectations
4. **Tenant Scoping**: Ensure all data is properly scoped to the current tenant
5. **Performance**: Monitor API response times with large datasets

## Performance Considerations

- Use database indexes on frequently queried fields (tenantId, status, submittedAt)
- Consider pagination for large datasets
- Implement caching for frequently accessed analytics data
- Monitor memory usage with large chart datasets