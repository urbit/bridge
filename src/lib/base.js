const getDomProps = props =>
  Object.entries(props).reduce((acc, [k, v]) => {
    return k.match(/prop-/) ? { ...acc, [k]: v } : acc;
  }, {});

export { getDomProps };
