export default function (searchConf = {}) {
  const {value} = searchConf;
  return (array) => {
    return value ? array.filter(item => JSON.stringify(item).toLowerCase().includes(value)) : array
  };
}