//from artemdudkin/source-copier

const spawn = require('child_process').spawn;
//@param commend    {string}   bash command
//@param opt        {Object}   opt
//@param opt.onData {Function} called when script writes new line
//                     @input data {String} string that child process returned this time (i.e. from 'onData' event)
//                     @input child {ChildProcess} child process object
//
//@returns {Object}
//  resultCode {int}
//  command    {string}
//  lines      {Array of string}
function run(command, opt) {
  return new Promise(function(resolve, reject){
    if (!command || typeof command != 'string') {
      reject({
        resultCode:-1,
        command:command,
        lines:["ERROR NO_COMMAND"]
      });
    }

    const result = {resultCode:0, command:command, lines:[]}    

    try{
      const cmd_args = command.split(" ");
      const cmd = cmd_args[0];
      cmd_args.shift();
    
      const proc = spawn(cmd, cmd_args);

      proc.stdout.on('data', function (data) {
        const s = data.toString('utf8');
        result.lines.push(s);
        if (opt && opt.onData) {
          if (typeof opt.onData == 'function'){
            opt.onData(s, proc);
          } else {
            result.lines.push('ERROR opt.onData is not a function');
          }
        }
      });

      proc.stderr.on('data', function (data) {
        const s = data.toString('utf8');
        result.lines.push(s);
        if (opt && opt.onData) {
          if (typeof opt.onData == 'function'){
            opt.onData(s, proc);
          } else {
            result.lines.push('ERROR opt.onData is not a function');
          }
        }
      });

      proc.on('exit', function (code) {
        result.lines.push('EXIT '+ code);
        if (code == 0) { 
          resolve(result);
        } else {
          result.resultCode = code;
          reject(result);
        }
      });

      proc.on('error', function (data) {
        result.lines.push('ERROR '+ data.toString('utf8'));
        reject(result);
      });

    } catch (err) {
      result.resultCode = -1;
      result.lines.push('ERROR '+ err.stack);
      reject(result);
    }
  })
}

module.exports = {
  runScript:run
}