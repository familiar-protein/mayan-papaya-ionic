
var app = angular.module('User',[]);


app.factory('UserFactory', ['$http', '$location', '$window', function($http, $location, $window) {

  var obj = {}; // export object so you can later add new objects and methods to our factories

  obj.signin = function (user) {
    return $http.post('http://localhost:3000/api/users/signin', {
      username: user.username,
      password: user.password
    })
    .then(function (resp) {
      return resp.data.token;
    });
  };

  obj.signup = function (user) {
    return $http.post('http://localhost:3000/api/users/signup', {
      username: user.username,
      password: user.password
    })
    .then(function (resp) {
      return resp.data.token;
    });
  };

  obj.isAuth = function () {
    // console.log($window.localStorage.getItem('com.TriviaWithFriends'));
    return !!$window.localStorage.getItem('com.TriviaWithFriends');
  };

  obj.signout = function () {
    obj.currentUser = null;
    $window.localStorage.removeItem('com.TriviaWithFriends');
    $window.localStorage.removeItem('com.TriviaWithFriends.username');
    $location.path('/signin');
  };

  return obj;
}]);

app.controller('UserController', ['$scope', '$window', '$location', 'UserFactory', '$ionicNavBarDelegate', function($scope, $window, $location, UserFactory, $ionicNavBarDelegate) {
  $scope.test = 'test';
  $scope.user = {};
  $scope.fail = false;

  $scope.switchView = function() {
    $scope.login = !$scope.login;
    var title = $scope.login ? 'Login' : 'Sign Up';
    $ionicNavBarDelegate.title(title);
  }

  $scope.signin = function () {
    UserFactory.signin($scope.user)
      .then(function (token) {
        $window.localStorage.setItem('com.TriviaWithFriends', token);
        $window.localStorage.setItem('com.TriviaWithFriends.username', $scope.user.username);
        $location.path('/app/trivia');
     })
     .catch(function (error) {
        $scope.fail = true;
      });
  };

  $scope.signup = function () {
    UserFactory.signup($scope.user)
      .then(function (token) {
        $window.localStorage.setItem('com.TriviaWithFriends', token);
        $window.localStorage.setItem('com.TriviaWithFriends.username', $scope.user.username);
        $location.path('/app/trivia');
      })
      .catch(function (error) {
        $scope.fail = true;;
      });
  };

  $scope.isAuth = UserFactory.isAuth;
  $scope.signout = UserFactory.signout;

}]);
