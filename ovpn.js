const stream = require('stream');
const { runScript } = require('./rs');

// prefix for ovpn user name that was created by this program
// (cannot add or delete others)
const NAME_PREFIX = 'rs-';


function getPrefix() {
  return NAME_PREFIX
}


/**
 * An object for controlling of transitions through a linear process, depending on the data that appears in an unpredictable way.
 *
 * 1. Data should be added by "addData" method.
 * 2. Periodically (after "wait" milliseconds), the saved data is checked to see if there is a "shouldHave" substring (for the current state)
 * 3. If there is, then call "action" (the current state) and move to the next state and clear the data;
 * 4. If not, then call "defaultAction" (no transition to another state).
 * 5. If there is no next state, then also call "defaultAction".
 */
function LineProcess(states) { // states = [{wait, shouldHave, action}, ...]
  this.states = states || [];
  this.state = -1;
  this.data = '';
  this.timer;
  this.defaultAction = ()=>{};
}
LineProcess.prototype.setDefaultAction = function( defaultAction) {
  this.defaultAction = defaultAction;
}
LineProcess.prototype.addData = function( data) {
  this.data = this.data + data;
}
LineProcess.prototype.next = function() {
  this.state = this.state + 1;
  this.data = '';

  let current_state = this.states[this.state];
  let wait = (current_state ? current_state.wait || 0 : 0);
  let self = this;

  this.timer = setTimeout(() => {

        if (!current_state) {
          self.defaultAction();
        } else {
          if (!current_state.shouldHave || (current_state.shouldHave && (self.data.indexOf(current_state.shouldHave) !== -1))) {
            if (typeof current_state.action === 'function') {
              current_state.action(self.data);
            } else {
            }
            self.next();
          } else {
            self.defaultAction();
          }
        }
  }, wait);
}


/**
 * Adds new ovpn user (using Nyr/openvpn-install)
 */
function add(name) {
  name = NAME_PREFIX + name;

  let saved = {};
  let proc = new LineProcess([{
      wait: 200,
      shouldHave: '4) Exit',
      action: () => (saved.child ? saved.child.stdin.write('1\n') : '')
    }, {
      wait: 200,
      shouldHave: 'Provide a name for the client:',
      action: () => (saved.child ? saved.child.stdin.write(name + '\n') : '')
    }, {
      wait: 1500
    }]
  );
  proc.setDefaultAction( () => {
    if (saved.child) saved.child.kill();
  })
  proc.next();

  return runScript('/root/openvpn-install.sh', {
    onData: (data, child) => {
      if (!saved.child) saved.child = child;
      proc.addData(data);
    }
  })
}


/**
 * Removes ovpn user (using Nyr/openvpn-install)
 */
function remove(name) {
  if (!name.startsWith(NAME_PREFIX)) name = NAME_PREFIX + name;

  let saved = {};

  let proc = new LineProcess([{
      wait: 200,
      shouldHave: '4) Exit',
      action: () => {
        saved.child.stdin.write('2\n');
      }
    }, {
      wait: 200,
      shouldHave: 'Select the client to revoke:',
      action: data => {
        const s = data.split('\n');
        let line = s.filter( itm => {
          return itm.indexOf(name) !== -1}
        )[0];
        if (line) {
          let number = line.split(')')[0] || '';
          if (number && saved.child) {
            saved.child.stdin.write( number.trim()+'\ny\n');
          }
        } else {
        }
      }
    }, {
      wait: 1500
    }]
  );
  proc.setDefaultAction( () => {
    if (saved.child) saved.child.kill();
  })
  proc.next();

  return runScript('/root/openvpn-install.sh', {
    onData: (data, child) => {
      if (!saved.child) saved.child = child;
      proc.addData(data);
    }
  })
}


/**
 * Return all ovpn user (using Nyr/openvpn-install)
 */
function get() {
  return new Promise((resolve, reject) => {
    let saved = {};

    let proc = new LineProcess([{
        wait: 200,
        shouldHave: '4) Exit',
        action: () => {
          saved.child.stdin.write('2\n');
        }
      }, {
        wait: 200,
        shouldHave: 'Select the client to revoke:',
        action: data => {
          const s = data.split('\n')
            .filter( itm => itm.indexOf(') ') !== -1)
            .map(itm => itm.split(') ')[1])
          s.sort();
          resolve(s);
        }
      }, {
        wait: 1500
      }]
    );
    proc.setDefaultAction( () => {
      if (saved.child) saved.child.kill();
    })
    proc.next();

    runScript('/root/openvpn-install.sh', {
      onData: (data, child) => {
        if (!saved.child) saved.child = child;
        proc.addData(data);
      }
    }).then(() => {
      reject();
    }).catch(err => {
      reject(err);
    })
  })
}



module.exports = {
  getPrefix,
  get, 
  add, 
  remove
}