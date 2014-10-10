// // The Hero
var move = function(gameData, helpers) {
    'use strict';

    var myHero = gameData.activeHero;

    var direction = null;
    var target    = null;

    // Find nearest tiles
    var locations = {
        enemy       : helpers.findNearestEnemy(gameData),
        weakerEnemy : helpers.findNearestWeakerEnemy(gameData),
        healthWell  : helpers.findNearestHealthWell(gameData),
        nonTeamMine : helpers.findNearestNonTeamDiamondMine(gameData)
    };

    // If low on health, always go for the nearest health well
    if (myHero.health <= 50 && locations.healthWell) {
        return locations.healthWell.direction;
    }

    // Find what's directly around me
    var nextLocations = {};

    var nextOccupied = {
        HealthWell  : [],
        DiamondMine : [],
        Unoccupied  : [],
        Impassable  : [],

        // Hero
        Enemy       : [],
        Teammate    : []
    };

    ['North', 'East', 'South', 'West'].forEach(function(direction) {
        var tile = helpers.getTileNearby(gameData.board, myHero.distanceFromTop, myHero.distanceFromLeft, direction);

        nextLocations[direction] = {
            direction : direction,
            tile      : tile
        };

        var type = tile.type;
        if (type) {
            if (tile.type === 'Hero') {
                type = (tile.team === myHero.team) ? 'Teammate' : 'Enemy';
            }

            nextOccupied[type].push({
                direction : direction,
                tile      : tile
            });
        }
    });

    // Look at nearby enemies first
    if (nextOccupied.Enemy.length > 0) {
        target = null;
        nextOccupied.Enemy.forEach(function(enemy) {
            // Only target enemies that don't have more health
            if (enemy.tile.health <= myHero.health) {

                // Target the enemy with the least amount of health
                if (target) {
                    if (enemy.tile.health < target.tile.health) {
                        target = enemy;
                    }
                } else {
                    target = enemy;
                }
            }
        });

        if (target) {
            direction = target.direction;
        }
    }

    if (direction) {
        return direction;
    }

    // Look at nearby teammates
    if (nextOccupied.Teammate.length > 0) {
        target = null;
        nextOccupied.Teammate.forEach(function(teammate) {
            // Only target teammates that don't have full health
            if (teammate.tile.health < 100) {

                // Target the teammate with the last amount of health
                if (target) {
                    if (teammate.tile.health < target.tile.health) {
                        target = teammate;
                    }
                } else {
                    target = teammate;
                }
            }
        });

        if (target) {
            direction = target.direction;
        }
    }

    if (direction) {
        return direction;
    }

    // Look at nearby wells
    if (myHero.health < 100 && nextOccupied.HealthWell.length > 0) {
        // Just choose the first healt well, it doesn't matter
        direction = nextOccupied.HealthWell[0].direction;
    }

    if (direction) {
        return direction;
    }

    // Look at nearby mines
    if (nextOccupied.DiamondMine.length > 0) {
        // Find first one that our team doesn't own
        // Dead teammember's mines are considered not owned
        nextOccupied.DiamondMine.every(function(mine) {
            if (!mine.tile.owner || mine.tile.owner.dead || mine.tile.owner.team !== myHero.team) {
                direction = mine.direction;

                return false;
            }

            return true;
        });
    }

    if (direction) {
        return direction;
    }

    // Look for graves to rob!
    if (nextOccupied.Unoccupied.length > 0) {
        // Find first grave
        nextOccupied.Unoccupied.every(function(unoccupied) {
            if (unoccupied.tile.subType === 'Bones') {
                direction = unoccupied.direction;

                return false;
            }

            return true;
        });
    }

    if (direction) {
        return direction;
    }

    // Look farther away

    var priorities = {
        enemy       : 1,
        weakerEnemy : 2,
        healthWell  : 4,
        nonTeamMine : 3
    };

    if (myHero.health > 50) {
        if (myHero.health === 100) {
            priorities.healthWell = 0;
        }

        var possibleActions = {
            weakerEnemy : !!locations.weakerEnemy,
            nonTeamMine : !!locations.nonTeamMine
        };

        var selectedAction = null;
        Object.keys(possibleActions).forEach(function(action) {
            if (!selectedAction || (locations[action] && locations[action].distance < locations[selectedAction].distance)) {
                selectedAction = action;
            }
        });

        priorities[selectedAction] = 100;
    } else {
        priorities.healthWell  = 10;

        priorities.nonTeamMine = 0;
        priorities.enemy       = 0;
        priorities.weakerEnemy = 0;
    }

    var action = 'healthWell';
    Object.keys(priorities).forEach(function(priority) {
        if (locations[priority] && priorities[priority] > priorities[action]) {
            action = priority;
        }
    });

    return locations[action].direction;
};

// Export the move function here
module.exports = move;
