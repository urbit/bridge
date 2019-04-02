

const invert = (key, state) => {
  return {
    [key]: !state[key],
  }
};


// const invert = (state, key) => {
//   return {
//     [key]: !state[key],
//   }
// };


const toTrue = key => {
  return {
    [key]: true,
  }
};

const toFalse = key => {
  return {
    [key]: false,
  }
};

const toNull = key => {
  return {
    [key]: false,
  }
};


// const chain = (context, key, data, ...fs) => {
//   fs.forEach(f => f());
//   context.setState({[k]: data});
// };



export {
  invert,
  toTrue,
  toFalse,
  toNull,
}
