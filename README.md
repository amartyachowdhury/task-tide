# Task-Tide: AI-Powered Task Scheduler

A modern, intelligent task management application that combines traditional to-do functionality with AI-powered features for enhanced productivity and smart scheduling.

![Task-Tide Screenshot](https://via.placeholder.com/800x400/6366f1/ffffff?text=Task-Tide+AI+Task+Scheduler)

## 🚀 Features

### Core Task Management
- **Rich Task Creation**: Add tasks with titles, descriptions, categories, priorities, due dates, and time estimates
- **Smart Categorization**: Organize tasks by Work, Personal, Health, and Learning categories
- **Priority Levels**: High, Medium, and Low priority with visual indicators
- **Due Date Management**: Set deadlines with overdue task highlighting
- **Time Estimation**: Track estimated hours for better planning

### 🤖 AI-Powered Intelligence
- **Smart Prioritization**: AI calculates priority scores based on urgency, keywords, and deadlines
- **Intelligent Suggestions**: Get personalized recommendations for task management
- **Overdue Detection**: Automatic identification and alerts for overdue tasks
- **Productivity Insights**: AI analyzes your task patterns and suggests improvements
- **Smart Filtering**: AI-enhanced task filtering and sorting

### 📅 Calendar Integration
- **Monthly Calendar View**: Visual calendar with task distribution
- **Task Scheduling**: See all tasks on their due dates
- **Today Highlighting**: Current date is prominently displayed
- **Task Density**: Visual indicators for busy days
- **Quick Task Access**: Click on calendar tasks for instant details

### 📊 Analytics Dashboard
- **Completion Tracking**: Monitor your task completion rate
- **Productivity Score**: AI-calculated productivity percentage
- **Time Blocking**: Track total time allocated to tasks
- **AI Usage Stats**: Monitor how often you use AI suggestions
- **Progress Visualization**: Clear metrics for productivity improvement

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Toggle between themes with persistent preference
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Polished interactions and transitions
- **Intuitive Navigation**: Easy switching between Tasks, Calendar, and Analytics
- **Accessibility**: Built with accessibility best practices

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling**: Modern CSS with CSS Variables, Flexbox, Grid
- **Icons**: Font Awesome 6.0
- **Fonts**: Inter (Google Fonts)
- **Storage**: LocalStorage for data persistence
- **AI Features**: Custom JavaScript algorithms for intelligent task management

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional dependencies required

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/task-tide.git
   cd task-tide
   ```

2. **Open the application**
   ```bash
   # Simply open index.html in your browser
   open index.html
   # Or serve it with a local server
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

3. **Start managing tasks!**
   - Add your first task using the task form
   - Explore the calendar view to see your schedule
   - Check the analytics to track your progress
   - Try the AI suggestions for smart recommendations

## 📖 How to Use

### Adding Tasks
1. Navigate to the Tasks view
2. Fill in the task form:
   - **Title**: Required task name
   - **Description**: Optional detailed description
   - **Category**: Choose from Work, Personal, Health, Learning
   - **Priority**: Select High, Medium, or Low
   - **Due Date**: Set a deadline (optional)
   - **Estimate**: Time in hours (optional)
3. Click "Add Task"

### AI Features
- **AI Score**: Each task gets an intelligent priority score (0-100)
- **Smart Suggestions**: Check the sidebar for AI recommendations
- **Overdue Alerts**: Get notified about overdue tasks
- **Productivity Tips**: Receive suggestions for better task management

### Calendar View
- **Navigation**: Use arrow buttons to navigate months
- **Task Display**: Tasks appear on their due dates
- **Quick Access**: Click on tasks to view details
- **Today Indicator**: Current date is highlighted

### Analytics
- **Completion Rate**: See how many tasks you've completed
- **Productivity Score**: AI-calculated efficiency percentage
- **Time Tracking**: Monitor total time allocated to tasks
- **AI Usage**: Track your engagement with AI features

## 🎯 AI Features Explained

### Smart Prioritization Algorithm

The AI calculates task priority scores based on:
- **Priority Level**: High (30 points), Medium (20 points), Low (10 points)
- **Due Date Urgency**:
  - Due today/tomorrow: +20 points
  - Due within 3 days: +15 points
  - Due within a week: +10 points
- **Keyword Analysis**: Tasks with urgent keywords get +15 points
- **Maximum Score**: Capped at 100 points

### Intelligent Suggestions

The AI provides contextual recommendations:
- **Overdue Tasks**: Alerts for tasks past their due date
- **Missing Deadlines**: Suggests setting due dates for high-priority tasks
- **Task Distribution**: Recommends breaking down large task categories
- **Productivity Motivation**: Encourages starting with quick wins

## 🎨 Customization

### Themes

- **Light Mode**: Clean, bright interface (default)
- **Dark Mode**: Easy on the eyes for low-light environments
- **Persistent**: Your theme preference is saved automatically

### Categories

Default categories include:
- **Work**: Professional tasks and projects
- **Personal**: Personal life and hobbies
- **Health**: Fitness, medical, and wellness
- **Learning**: Education and skill development

## 📱 Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔧 Development

### Project Structure
```
task-tide/
├── index.html          # Main HTML structure
├── style.css           # Complete styling and themes
├── script.js           # Core application logic
├── images/             # Icons and assets
│   ├── checked.png
│   ├── unchecked.png
│   └── icon.png
└── README.md           # This file
```

### Key Components
- **TaskTideApp Class**: Main application controller
- **Task Management**: CRUD operations for tasks
- **AI Engine**: Smart prioritization and suggestions
- **Calendar Renderer**: Dynamic calendar generation
- **Theme Manager**: Dark/light mode switching
- **Data Persistence**: LocalStorage integration

## 🚀 Future Enhancements

### Planned Features
- [ ] **Drag & Drop**: Drag tasks between calendar dates
- [ ] **Task Dependencies**: Link related tasks
- [ ] **Time Tracking**: Actual vs. estimated time tracking
- [ ] **Export/Import**: Backup and restore functionality
- [ ] **Team Collaboration**: Share tasks with others
- [ ] **Advanced AI**: Machine learning for better predictions
- [ ] **Notifications**: Browser notifications for deadlines
- [ ] **Pomodoro Timer**: Built-in focus timer
- [ ] **Habit Tracking**: Daily habit integration
- [ ] **Goal Setting**: Long-term goal management

### AI Improvements
- [ ] **Natural Language Processing**: Parse task descriptions for better categorization
- [ ] **Predictive Scheduling**: Suggest optimal times for tasks
- [ ] **Pattern Recognition**: Learn from your productivity patterns
- [ ] **Smart Reminders**: Context-aware notification timing
- [ ] **Task Breakdown**: AI-powered subtask generation

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and patterns
- Add comments for complex logic
- Test on multiple browsers
- Ensure responsive design
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Font Awesome** for the beautiful icons
- **Google Fonts** for the Inter typeface
- **CSS Grid & Flexbox** for modern layout capabilities
- **LocalStorage API** for data persistence
- **Modern JavaScript** for clean, efficient code

## 📞 Support

If you encounter any issues or have questions:

1. **Check the Issues**: Look through existing GitHub issues
2. **Create an Issue**: Describe the problem with steps to reproduce
3. **Feature Requests**: Suggest new features via GitHub issues
4. **Documentation**: Check this README for usage instructions

---

## Made with ❤️ for productivity enthusiasts

*Task-Tide: Where AI meets productivity*
