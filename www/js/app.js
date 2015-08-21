// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'Trivia', 'Profile', 'User'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.run(function ($rootScope, $state, UserFactory) {
  $rootScope.$on('$stateChangeStart', function(event, next) {
    if (!next.data.publicallyAccessible && !UserFactory.isAuth()) {
      event.preventDefault();
      $state.go('app.auth');
    }
  });
})

.factory('AttachTokens', function($window) {
  // this is an $httpInterceptor
  // its job is to stop all out going request
  // then look in local storage and find the user's token
  // then add it to the header so the server can validate the request
  var attach = {
    request: function (object) {
      var jwt = $window.localStorage.getItem('com.TriviaWithFriends');
      if (jwt) {
        object.headers['x-access-token'] = jwt;
      }
      //object.headers['Allow-Control-Allow-Origin'] = '*';
      return object;
    }
  };
  return attach;
})

.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'UserController',
    data: { publicallyAccessible: true }
  })

  .state('app.auth', {
    url: '/welcome',
    views: {
      'menuContent': {
        templateUrl: 'templates/auth.html',
        controller: 'UserController'
      }
    },
    data: { publicallyAccessible: true }
  })

  .state('app.trivia', {
    url: '/trivia',
    views: {
      'menuContent': {
        templateUrl: 'templates/trivia.html',
        controller: 'ProfileController'
      }
    },
    data: { publicallyAccessible: false }
  })

      .state('app.trivia.play', {
        url: '/play',
        views: {
          'menuContent@app': {
            templateUrl: 'templates/trivia.play.html',
            controller: 'TriviaController'
          }
        },
        data: { publicallyAccessible: false }
      })

  .state('app.profile', {
    url: '/profile',
    views: {
      'menuContent': {
        templateUrl: 'templates/profile.html',
        controller: 'ProfileController'
      }
    },
    data: { publicallyAccessible: false }
  })

  $httpProvider.interceptors.push('AttachTokens');

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/welcome');
});
