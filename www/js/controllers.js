angular.module('starter.controllers', ['LocalStorageModule','ionic'])

.controller('CharacterCtrl', function($rootScope, $window,$scope, User, Refresh, localStorageService) {
  User.get({id : localStorageService.get('userId')}, function (user) {
    $rootScope.user = user;
    debugger;
  });


  $scope.refresh = function() {
    var id = localStorageService.get('userId');
    Refresh.get({id: id}, function() { // this will tell fitbit to get new data
      User.get({id : id}, function (user) { // this will retrieve that new data
        $rootScope.user = user;
        $window.alert("Successfully retrieved data for", id);
        location.href = location.pathname; //refresh page
      });
    });
  };

  $scope.hasSkillPoints = function() {
    if ($rootScope.user.attributes.skillPoints) {
      return true;
    } else {
      return false;
    }
  };

  $scope.applyAttributes = function(attr) {
    $rootScope.user.attributes[attr]++;
    $rootScope.user.attributes.skillPoints--;
    if (attr === 'vitality') {
      // change char class from warrior to user class
      $rootScope.user.attributes.hp = util.updateHp($rootScope.user.attributes.hp,'warrior');
      $rootScope.user.attributes.maxHp = util.updateHp($rootScope.user.attributes.maxHp,'warrior');
    }
    // update database
    User.update($rootScope.user);
  };

  $scope.isEquipped = function(slot) {
    if ($rootScope.user.attributes[slot] !== undefined) {
      return true;
    } else {
      return false;
    }
  };

  $scope.unequip = function(slot){
    $rootScope.user.attributes[slot] = undefined;
    // update database
    User.update($rootScope.user);
  };

  $scope.equip = function(slot){
  };
})

.controller('FriendsCtrl', function($scope, User) {
// friends is accessed from $rootScope.user

  $scope.requestBattle = function(id) {
    // update $scope.battle to reflect status of pending with friend
    // post to database to update friends battle status
  };
})

// not currently being used
// .controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
//   $scope.friend = Friends.get($stateParams.friendId);
// })

.controller('AddFriendsCtrl', function($scope) {
  // friends is accessed from $rootScope.user.friends in the template
})

.controller('InventoryCtrl', function($scope, Shop) {
  // inventory is accessed from $rootScope.user.inventory in the template
  var inventory = $rootScope.user.inventory;
  $scope.inventory = [];

  Shop.query( function (storeItems) {
    for (var i=0, i<inventory.length; i++) {
      var itemId = inventory[i].storeId;
      for (var j=0; j<storeItems.length; j++) {
        var storeItem = storeItems[j];
        if (storeItem.id === itemId){
          storeItem['inventoryId'] = inventory[i].id;
          $scope.inventory.push(storeItem);
        }
      }
    }
  });

  $scope.equipment = function() {
    $scope.isEquipment = true;
  };

  $scope.potion = function() {
    $scope.isEquipment = false;
  };

  $scope.equipment();

})

.controller('InventoryDetailCtrl', function($scope, $stateParams, Shop, $ionicPopup, $q) {
  var item;
  var index;
  var inventory = $rootScope.user.inventory;

  for (var i=0; i<inventory.length; i++) {
    if (inventory[i].id === $stateParams.inventoryId) {
      index = i;
      item = inventory[index];
    }
  }

  $scope.inventoryItem = Shop.get({id : item.storeId});

  $scope.addClass = function(attr) {
    if (attr > 0) {
      return 'text-green';
    } else {

      return 'text-red';
    }
  };

  var showAlert = function(title, body, button) {
    var alertPopup = $ionicPopup.alert({
      title: title,
      template: body,
      okText: button
    });
    alertPopup.then(function(res) {
      $state.go('app.character');
    });
  };

  $scope.sellItem = function() {
    $rootScope.user.attributes.gold = $rootScope.user.attributes.gold + $scope.inventoryItem.sellPrice;
    if ($scope.inventoryItem.type !== 'potion') {
      // remove from inventory
      $rootScope.user.inventory.splice(index, 1);
    } else {
      if (item.quantity > 1) {
        item.quantity -= 1;
      } else if (item.quantity === 1) {
        $rootScope.user.inventory.splice(index, 1);
      }
    }
    // save user
    User.update($rootScope.user);
    showAlert('Item Sold','You received ' + $scope.inventoryItem.sellPrice + ' gold for your item.', 'OK');
  };

  $scope.equipItem = function() {
    if (item.equipped === false) {
      if ($scope.inventoryItem.type === 'weapon') {
        if ($scope.inventoryItem.size === 1) {
          if ($rootScope.user.attributes.weapon1 === undefined) {
            $rootScope.user.attributes.weapon1 = item.id;
            item.equipped = true;
          } else if ($rootScope.user.attributes.weapon2 === undefined) {
            $rootScope.user.attributes.weapon2 = item.id;
            item.equipped = true;
          }
        } else if ($scope.inventoryItem.size === 2) {
          if ($rootScope.user.attributes.weapon1 === undefined && $rootScope.user.attributes.weapon2 === undefined) {
            $rootScope.user.attributes.weapon1 = item.id;
            $rootScope.user.attributes.weapon2 = item.id;
            item.equipped = true;
          }
        }
      } else if ($scope.inventoryItem.type === 'armor') {
        if ($rootScope.user.attributes.armor === undefined) {
          $rootScope.user.attributes.armor = item.id;
          item.equipped = true;
        }
      } else if ($scope.inventoryItem.type === 'accessory') {
        if ($rootScope.user.attributes.accessory1 === undefined) {
          $rootScope.user.attributes.accessory1 = item.id;
          item.equipped = true;
        } else if ($rootScope.user.attributes.accessory2 === undefined) {
          $rootScope.user.attributes.accessory2 = item.id;
          item.equipped = true;
        }
      }
      User.update($rootScope.user);
      showAlert('Item Equipped','You are ready to wage war against the forces of evil.', 'OK')
    } else {
      showAlert('Item Already Equipped','You are already using this item. Select a different item to equip.', 'OK')
    }
  };

  $scope.useItem = function() {
    if (item.quantity > 0) {
      $rootScope.user.attributes.hp += $scope.inventoryItem.hp;
      // subtract quantity from inventory -> remove if quantity = 0
      item.quantity -= 1;
    }

    if (item.quantity === 0) {
      $rootScope.user.inventory.splice(index, 1);
    }

    User.update($rootScope.user);
    showAlert('HP Recovered','Your HP is recovering!', 'OK')
  }

  $scope.checkType = function() {
    if ($scope.inventoryItem.type === 'potion') {
      return true;
    } else {
      return false;
    }
  }
})

.controller('ShopCtrl', function($scope, Shop) {
  $scope.equipment = function() {
    $scope.isEquipment = true;
    $scope.shop = [];
    Shop.query( function (items) {
      var userLvl = $rootScope.user.attributes.level;

      for (var i=0, i<items.length; i++) {
        var item = items[i];
        if (userLvl >= item.level) {
          $scope.shop.push(item);
        }
      }

    });
  };

  $scope.potion = function(id) {
    // get data from battle history database
    // replace $scope.battles with results
    $scope.isEquipment = false;
    $scope.shop = [];
    Shop.query( function (items) {
      for (var i=0; i<items.length; i++) {
        var item = items[i];
        if (item.type === 'potion') {
          $scope.shop.push(item)
        }
      }
    });
  };

  $scope.equipment();
})

.controller('ShopDetailCtrl', function($scope, $stateParams, Shop) {
  $scope.shopItem = Shop.get({id : $stateParams.shopId});
  $scope.addClass = function(attr) {
    if (attr > 0) {
      return 'text-green';
    } else {
      return 'text-red';
    }
  };

  $scope.buyItem = function() {
    $rootScope.user.attributes.gold = $rootScope.user.attributes.gold - $scope.shopItem.cost;
    // add to inventory
    var found = false;
    var inventoryId = 0;
    if ($rootscope.user.inventory.length > 0) {
      inventoryId = $rootscope.user.inventory[$rootscope.user.inventory.length-1].id+1;
    }

    if ($scope.shopItem.type === 'potion') {
      var inventory = $rootscope.user.inventory;
      for (var i=0; i<inventory.length; i++) {
        var item = inventory[i];
        if (item.storeId === $scope.shopItem.id) {
          found = true;
          item.quantity++;
        }
      }

      if (!found) {
        $rootScope.user.inventory.add({id: inventoryId, quantity: 1, equipped: false, storeId:$scope.shopItem.id});
      }
    } else {
      $rootScope.user.inventory.add({id: inventoryId, quantity: 1, equipped: false, storeId:$scope.shopItem.id});
    }
    User.update($rootScope.user);
  };

  $scope.checkType = function() {
    if ($scope.shopItem.type === 'potion') {
      return true;
    } else {
      return false;
    }
  }
})

.controller('BattleCtrl', function($scope, Battle, User) {

  $scope.cancelBattle = function(id) {
    // remove battle from $scope.user.battles
    var indexOfBattle;
    var battle;
    for(var i = 0; i < $scope.user.missionsVersus.length; i++){
      if ($scope.user.missionsVersus[i].id === id) {
        indexOfBattle = i;
        battle = $scope.user.missionsVersus[i];
      }
    }

    $scope.user.battles.splice(indexOfbattle, 1);
    // update database for both players
    User.update($scope.user);
    User.get({id : battle.enemy}, function(user){
      var index;
      for(var i = 0; i < user.missionsVersus.length; i++){
        if (user.missionsVersus[i].id === id) {
          index = i;
        }
      }
      user.missionsVersus.splice(index, 1);
      User.update(user);
    })

  };

  $scope.startBattle = function(id) {
    // get the correct battle
    var battle;
    for(var i = 0; i < $scope.user.missionsVersus.length; i++){
      if ($scope.user.missionsVersus[i].id === id) {
        battle = $scope.user.missionsVersus[i];
      }
    }
    // get user attributes from database
    User.get({id : battle.enemy}, function(enemy){
      var enemyBattle;
      for(var i = 0; i < enemy.missionsVersus.length; i++){
        if (enemy.missionsVersus[i].id === id) {
          enemyBattle = enemy.missionsVersus[i];
        }
      }
      // use game logic to determine winner of battle
      // post battle results to database for both players
      User.update(user);
      User.update(enemy);
    })
  };

  $scope.pending = function() {
    $scope.isPending = true;
    Battle.query(function(battles){
      $scope.battles = battles;
    })
  };

  $scope.history = function(id) {
    // get data from battle history database
    // replace $scope.battles with results
    $scope.isPending = false;
    $scope.battles = [];
  };

  $scope.historyData = [20,45,3]; //win,loss,tie get rid of hard coded data

  $scope.pending();
})

// not currently being used
// .controller('BattleDetailCtrl', function($scope, $stateParams, Battle) {
//   $scope.battle = Battle.get($stateParams.battleId);
// })

.controller('SoloMissionCtrl', function($scope, SoloMissions, User) {

  $scope.new = function() {
    $scope.soloMissions = [];
    SoloMissions.query(function(solos){
      var allSoloMissions = solos;
      var soloMission;

      //need to filter missions that are complete or greater than current user level
      for (var i=0; i< allSoloMissions.length; i++) {
        soloMission = allSoloMissions[i];
        if (soloMission.level <= user.attributes.level) {
          $scope.soloMissions.push(soloMission);
        }
      }
    })
  };

  $scope.complete = function() {
    // completed missions in user database
    $scope.soloMissions = [];
  };


})

.controller('SoloMissionDetailCtrl', function($scope, $stateParams, SoloMissions, $ionicPopup, $timeout, $q) {
  $scope.soloMission = SoloMissions.get($stateParams.missionId);

  $scope.difficulty = function(num) {
    if ( num <= $scope.soloMission.difficulty ) {
      return true;
    } else {
      return false;
    }
  };

  $scope.showAlert = function() {
    var alertPopup = $ionicPopup.alert({
      title: 'Mission Started',
      template: 'You are waging war against the forces of evil...',
      okText: 'Continue'
    });
    alertPopup.then(function(res) {
      $scope.showResults();
    })
  };

  $scope.showResults = function() {
    //do game logic to see if you win
      // if win give exp and gold
        // display 'You are victorious!'
        // mark mission as complete
      // if lose display on screen
        // diplay 'You are no match for [boss name]'

    var alertPopup = $ionicPopup.alert({
      title: 'Mission Results',
      template: 'You are victorious!',
      okText: 'Close'
    });
    alertPopup.then(function(res) {
    })
  };

  $scope.startMission = function() {
    if ($scope.soloMission.type === 'boss') {
      $scope.showAlert();
    } else {
      //if solo mission is quest
        // save start time of quest
        // if accomplish goals within duration
          // display 'You have completed quest!'
        // if not
          // display 'Your quest has failed.'
    }
  };
})

.controller('VersusMissionCtrl', function($scope, VersusMissions) {

  $scope.new = function() {
    $scope.isComplete = false;
    VersusMissions.query(function(versusMissions) {
        $scope.versusMissions = versusMissions;
    })
  };

  $scope.complete = function() {
    // completed missions in user database
    $scope.isComplete = true;
    $scope.versusMissions = [];

    // update user in scope and database
  };

  $scope.new();

})

.controller('VersusMissionDetailCtrl', function($scope, $stateParams, VersusMissions) {
  $scope.versusMission = VersusMissions.get($stateParams.missionId);
  for(var i = 0; i < $scope.user.friends; i++){
    User.get({id : $scope.user.friends[i]}, function(friend) {
      $scope.friends.add(friend);
    })
  }

  $scope.selectFriends = function() {
    $scope.showFriends = true;
  };

  $scope.addFriend = function(id) {
    if ($scope.versusMission.friends.length < $scope.versusMission.size) {
      $scope.versusMission.friends.push(id);
    }
  };

  $scope.removeFriend = function(id) {
    for (var i=0; i<$scope.versusMission.friends.length; i++) {
      var friend = $scope.versusMission.friends[i];
      if (friend === id) {
        $scope.versusMission.friends.splice(i,1);
      }
    }
  };

  $scope.inParty = function(id) {
    for (var i=0; i<$scope.versusMission.friends.length; i++) {
      var friend = $scope.versusMission.friends[i];
      if (friend === id) {
        return true;
      }
    }
    return false;
  };

  $scope.requestMission = function() {
    // push notify friends of mission
  };

  // server side could check if all friends accepted mission
  // if all friend accept mission, push notify all friends that mission is starting

  $scope.checkMissionStatus = function() {
    // check start time and duration
    // if past duration check participants data
    // may need to check time intervals for when someone won?
  };

  $scope.checkMissionStatus();
})

.controller('LeaderboardCtrl', function($scope, Leaderboard, Friends) {
  $scope.all = function() {
    User.query(function(users) {
      $scope.leaderboard = users;
    })
  };

  $scope.friends = function() {
    for(var i = 0; i < $scope.user.friends; i++){
      User.get({id : $scope.user.friends[i]}, function(user) {
        $scope.leaderboard.add(user);
      })
    }
  };

  $scope.all();
})

// not currently being used
// .controller('LeaderboardDetailCtrl', function($scope, $stateParams, Leaderboard) {
//   $scope.leader = Leaderboard.get($stateParams.leaderId);
// })

.controller('HelpCtrl', function($scope, $stateParams, Leaderboard) {
})

// .controller('LogoutCtrl', function($scope, $state, localStorageService, $window) {
//   $scope.logout = function () {
//     localStorageService.clearAll();
//     $window.location.reload();
//   };
// })

.controller('LoginCtrl', function($scope, $state) {
  $scope.login = function() {
    $state.go('create');
  };
})

.controller('CreateCtrl', function($scope, $state) {
  $scope.dash = function() {
    $state.go('tab.character');
  };
})

.controller('AccountCtrl', function($scope) {
});
