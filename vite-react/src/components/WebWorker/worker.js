self.onmessage = (event) => {
  console.log(event.data);
  for (let i = 0; i < 10000000000; i++) {}
  
  self.postMessage("Heavy Task Completed...")
};
