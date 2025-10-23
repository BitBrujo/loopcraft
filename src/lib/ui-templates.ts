/**
 * UI Component Template Library for Conversational UI Builder
 * Provides pre-built HTML templates for common UI patterns
 */

export type UICategory =
  | 'forms'
  | 'dashboards'
  | 'tables'
  | 'charts'
  | 'galleries'
  | 'custom';

export interface UITemplate {
  id: string;
  name: string;
  category: UICategory;
  description: string;
  userNeeds: string; // "I need a contact form with email and message"
  aiGenerates: string; // "Generates HTML form with validation"
  htmlContent: string;
  templatePlaceholders?: string[]; // e.g., ['user.name', 'company.logo']
  suggestedActions?: string[]; // Suggested interactive elements for action mapping
}

/**
 * UI Component Templates organized by category
 */
export const uiTemplates: UITemplate[] = [
  // FORMS Category
  {
    id: 'contact-form',
    name: 'Contact Form',
    category: 'forms',
    description: 'Simple contact form with name, email, and message fields',
    userNeeds: 'I need a contact form for users to reach out',
    aiGenerates: 'Generates responsive contact form with validation',
    htmlContent: `<div class="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Contact Us</h2>
  <form id="contact-form" class="space-y-4">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
      <input type="text" id="name" name="name" required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
    </div>
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
      <input type="email" id="email" name="email" required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
    </div>
    <div>
      <label for="message" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message *</label>
      <textarea id="message" name="message" rows="4" required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"></textarea>
    </div>
    <button type="submit" id="submit-btn"
      class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
      Send Message
    </button>
  </form>
</div>`,
    suggestedActions: ['submit-btn'],
  },
  {
    id: 'signup-form',
    name: 'Sign Up Form',
    category: 'forms',
    description: 'User registration form with password confirmation',
    userNeeds: 'I need a signup form for new users',
    aiGenerates: 'Generates signup form with password validation',
    htmlContent: `<div class="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create Account</h2>
  <form id="signup-form" class="space-y-4">
    <div>
      <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username *</label>
      <input type="text" id="username" name="username" required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
    </div>
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
      <input type="email" id="email" name="email" required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
    </div>
    <div>
      <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
      <input type="password" id="password" name="password" required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
    </div>
    <div>
      <label for="confirm-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password *</label>
      <input type="password" id="confirm-password" name="confirmPassword" required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
    </div>
    <button type="submit" id="signup-btn"
      class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
      Sign Up
    </button>
  </form>
</div>`,
    suggestedActions: ['signup-btn'],
  },
  {
    id: 'login-form',
    name: 'Login Form',
    category: 'forms',
    description: 'Simple login form with remember me option',
    userNeeds: 'I need a login form for user authentication',
    aiGenerates: 'Generates login form with remember me checkbox',
    htmlContent: `<div class="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Sign In</h2>
  <form id="login-form" class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
      <input type="email" id="email" name="email" required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
    </div>
    <div>
      <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
      <input type="password" id="password" name="password" required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
    </div>
    <div class="flex items-center">
      <input type="checkbox" id="remember" name="remember"
        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
      <label for="remember" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">Remember me</label>
    </div>
    <button type="submit" id="login-btn"
      class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
      Sign In
    </button>
  </form>
</div>`,
    suggestedActions: ['login-btn'],
  },
  {
    id: 'feedback-form',
    name: 'Feedback Form',
    category: 'forms',
    description: 'Product feedback form with rating',
    userNeeds: 'I need a feedback form with star rating',
    aiGenerates: 'Generates feedback form with 5-star rating selector',
    htmlContent: `<div class="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Your Feedback</h2>
  <form id="feedback-form" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating *</label>
      <div class="flex gap-2">
        <input type="radio" id="star1" name="rating" value="1" class="sr-only" />
        <label for="star1" class="text-2xl cursor-pointer hover:text-yellow-400">⭐</label>
        <input type="radio" id="star2" name="rating" value="2" class="sr-only" />
        <label for="star2" class="text-2xl cursor-pointer hover:text-yellow-400">⭐</label>
        <input type="radio" id="star3" name="rating" value="3" class="sr-only" />
        <label for="star3" class="text-2xl cursor-pointer hover:text-yellow-400">⭐</label>
        <input type="radio" id="star4" name="rating" value="4" class="sr-only" />
        <label for="star4" class="text-2xl cursor-pointer hover:text-yellow-400">⭐</label>
        <input type="radio" id="star5" name="rating" value="5" class="sr-only" />
        <label for="star5" class="text-2xl cursor-pointer hover:text-yellow-400">⭐</label>
      </div>
    </div>
    <div>
      <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
      <select id="category" name="category" required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
        <option value="">Select category</option>
        <option value="bug">Bug Report</option>
        <option value="feature">Feature Request</option>
        <option value="improvement">Improvement</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div>
      <label for="comments" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comments *</label>
      <textarea id="comments" name="comments" rows="4" required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"></textarea>
    </div>
    <button type="submit" id="submit-feedback-btn"
      class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
      Submit Feedback
    </button>
  </form>
</div>`,
    suggestedActions: ['submit-feedback-btn'],
  },

  // DASHBOARDS Category
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    category: 'dashboards',
    description: 'Analytics dashboard with metric cards',
    userNeeds: 'I need a dashboard showing key metrics',
    aiGenerates: 'Generates dashboard with metric cards and stats',
    htmlContent: `<div class="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
  <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Analytics Dashboard</h1>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Users</div>
      <div class="text-3xl font-bold text-gray-900 dark:text-white">{{metrics.totalUsers}}</div>
      <div class="text-sm text-green-600 mt-2">↑ 12% from last month</div>
    </div>
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Revenue</div>
      <div class="text-3xl font-bold text-gray-900 dark:text-white">\${{metrics.revenue}}</div>
      <div class="text-sm text-green-600 mt-2">↑ 8% from last month</div>
    </div>
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active Sessions</div>
      <div class="text-3xl font-bold text-gray-900 dark:text-white">{{metrics.activeSessions}}</div>
      <div class="text-sm text-red-600 mt-2">↓ 3% from last month</div>
    </div>
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Conversion Rate</div>
      <div class="text-3xl font-bold text-gray-900 dark:text-white">{{metrics.conversionRate}}%</div>
      <div class="text-sm text-green-600 mt-2">↑ 5% from last month</div>
    </div>
  </div>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
    <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recent Activity</h2>
    <div class="space-y-3">
      <div class="flex items-center justify-between py-2 border-b dark:border-gray-700">
        <span class="text-sm text-gray-600 dark:text-gray-400">New user registered</span>
        <span class="text-xs text-gray-500">2 minutes ago</span>
      </div>
      <div class="flex items-center justify-between py-2 border-b dark:border-gray-700">
        <span class="text-sm text-gray-600 dark:text-gray-400">Order #1234 completed</span>
        <span class="text-xs text-gray-500">5 minutes ago</span>
      </div>
      <div class="flex items-center justify-between py-2">
        <span class="text-sm text-gray-600 dark:text-gray-400">Payment received</span>
        <span class="text-xs text-gray-500">12 minutes ago</span>
      </div>
    </div>
  </div>
</div>`,
    templatePlaceholders: ['metrics.totalUsers', 'metrics.revenue', 'metrics.activeSessions', 'metrics.conversionRate'],
  },
  {
    id: 'user-profile-dashboard',
    name: 'User Profile Dashboard',
    category: 'dashboards',
    description: 'User profile with editable information',
    userNeeds: 'I need a user profile page with edit capability',
    aiGenerates: 'Generates user profile dashboard with edit form',
    htmlContent: `<div class="max-w-4xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <div class="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
    <div class="px-6 pb-6">
      <div class="-mt-16 mb-4">
        <img src="{{user.avatar}}" alt="Profile" class="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800" />
      </div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{{user.name}}</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-4">{{user.email}}</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
          <p class="text-gray-900 dark:text-white">{{user.role}}</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Member Since</label>
          <p class="text-gray-900 dark:text-white">{{user.memberSince}}</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
          <p class="text-gray-900 dark:text-white">{{user.location}}</p>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <p class="text-green-600">Active</p>
        </div>
      </div>
      <button id="edit-profile-btn"
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
        Edit Profile
      </button>
    </div>
  </div>
</div>`,
    templatePlaceholders: ['user.avatar', 'user.name', 'user.email', 'user.role', 'user.memberSince', 'user.location'],
    suggestedActions: ['edit-profile-btn'],
  },

  // TABLES Category
  {
    id: 'data-table',
    name: 'Data Table',
    category: 'tables',
    description: 'Responsive data table with actions',
    userNeeds: 'I need a table to display user data',
    aiGenerates: 'Generates responsive table with sorting and actions',
    htmlContent: `<div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Users</h2>
    <button id="add-user-btn"
      class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
      Add User
    </button>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Name</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Email</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Role</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Status</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
        <tr>
          <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">John Doe</td>
          <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">john@example.com</td>
          <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">Admin</td>
          <td class="px-4 py-3"><span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span></td>
          <td class="px-4 py-3">
            <button class="text-blue-600 hover:text-blue-700 text-sm mr-2">Edit</button>
            <button class="text-red-600 hover:text-red-700 text-sm">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`,
    suggestedActions: ['add-user-btn'],
  },

  // GALLERIES Category
  {
    id: 'image-gallery',
    name: 'Image Gallery',
    category: 'galleries',
    description: 'Responsive image gallery with lightbox',
    userNeeds: 'I need an image gallery to showcase photos',
    aiGenerates: 'Generates responsive image gallery grid',
    htmlContent: `<div class="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
  <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Gallery</h1>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    <div class="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
      <img src="{{images.0.url}}" alt="{{images.0.title}}" class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300" />
      <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
        <span class="text-white opacity-0 group-hover:opacity-100 transition-opacity">{{images.0.title}}</span>
      </div>
    </div>
    <div class="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
      <img src="{{images.1.url}}" alt="{{images.1.title}}" class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300" />
      <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
        <span class="text-white opacity-0 group-hover:opacity-100 transition-opacity">{{images.1.title}}</span>
      </div>
    </div>
  </div>
</div>`,
    templatePlaceholders: ['images.0.url', 'images.0.title', 'images.1.url', 'images.1.title'],
  },

  // CUSTOM Category
  {
    id: 'search-results',
    name: 'Search Results Page',
    category: 'custom',
    description: 'Search results with filters',
    userNeeds: 'I need a search results page with filters',
    aiGenerates: 'Generates search results page with sidebar filters',
    htmlContent: `<div class="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Search Results</h1>
    <div class="flex gap-2">
      <input type="text" id="search-input" placeholder="Search..."
        class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" />
      <button id="search-btn"
        class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
        Search
      </button>
    </div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    <div class="md:col-span-1">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-bold text-gray-900 dark:text-white mb-3">Filters</h3>
        <div class="space-y-2">
          <label class="flex items-center">
            <input type="checkbox" name="filter-new" class="mr-2" />
            <span class="text-sm text-gray-700 dark:text-gray-300">New Items</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" name="filter-sale" class="mr-2" />
            <span class="text-sm text-gray-700 dark:text-gray-300">On Sale</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" name="filter-featured" class="mr-2" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Featured</span>
          </label>
        </div>
      </div>
    </div>
    <div class="md:col-span-3">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-4">
        <h3 class="font-bold text-lg text-gray-900 dark:text-white mb-2">Search Result Title</h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm">Result description goes here...</p>
      </div>
    </div>
  </div>
</div>`,
    suggestedActions: ['search-btn'],
  },
];

/**
 * Get templates organized by category
 */
export function getCategorizedUITemplates(): Record<UICategory, UITemplate[]> {
  const categorized: Record<UICategory, UITemplate[]> = {
    forms: [],
    dashboards: [],
    tables: [],
    charts: [],
    galleries: [],
    custom: [],
  };

  for (const template of uiTemplates) {
    categorized[template.category].push(template);
  }

  return categorized;
}

/**
 * Get category metadata
 */
export function getUICategoryInfo(category: UICategory): { icon: string; title: string; description: string } {
  const categoryInfo: Record<UICategory, { icon: string; title: string; description: string }> = {
    forms: {
      icon: 'file-text',
      title: 'Forms',
      description: 'Input forms for data collection',
    },
    dashboards: {
      icon: 'layout-dashboard',
      title: 'Dashboards',
      description: 'Data visualization and metrics',
    },
    tables: {
      icon: 'table',
      title: 'Tables',
      description: 'Tabular data display',
    },
    charts: {
      icon: 'line-chart',
      title: 'Charts',
      description: 'Data charts and graphs',
    },
    galleries: {
      icon: 'image',
      title: 'Galleries',
      description: 'Image and media galleries',
    },
    custom: {
      icon: 'settings',
      title: 'Custom',
      description: 'Custom UI components',
    },
  };

  return categoryInfo[category];
}

/**
 * Find template by ID
 */
export function findUITemplate(id: string): UITemplate | undefined {
  return uiTemplates.find((template) => template.id === id);
}
