//Not sure what this is referring to, fired errors when trying to load site, may need to be removed - A. Garcia
document.addEventListener(
  'DOMContentLoaded',
  () => {
    console.log('IronGenerator JS imported successfully!');
  },
  false
);

//declare global api variable
const apiUrl = `https://www.thecocktaildb.com/api/json/v1/${process.env.API_KEY}/`;

module.exports = apiUrl;
