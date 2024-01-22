/* eslint-disable no-console */
export default async function linkValidator() {
  const appContainer = document.getElementById('app');
  const title = document.querySelector('#title');
  const list = document.createElement('ul');
  appContainer.appendChild(list);

  const deployId = 'AKfycbzIdYez46Yqf21v7hoBCplIzUSiOHg7dq2BaRPo8Tq2BvOXQejgSFfDgdYIxuSvPSkr';
  const appScriptUrl = `https://script.google.com/macros/s/${deployId}/exec`;
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.size === 0 || !urlParams.has('referrer')) {
    title.innerText = 'URL incorrectly configured';
    document.body.classList.add('error', 'loaded');
  } else {
    /* eslint-disable prefer-destructuring */
    let documentId = urlParams.get('referrer');
    documentId = documentId.split('https://docs.google.com/document/d/')[1];
    documentId = documentId.split('/')[0];
    const fetchUrl = `${appScriptUrl}?id=${documentId}`;

    try {
      const response = await fetch(fetchUrl, {
        redirect: 'follow',
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data) {
          if (data.length === 0) {
            title.innerText = 'No links found';
          } else {
            const filteredData = data.filter(({ url }) => url.startsWith('https://docs.google.com/document'));
            if (filteredData.length === 0) {
              title.innerText = 'No invalid links found';
            } else {
              title.innerText = 'Invalid links';
              filteredData.forEach(({
                endOffsetInclusive,
                startOffset,
                text,
                url,
              }) => {
                const linkText = text.substring(startOffset, endOffsetInclusive + 1);
                const listItem = document.createElement('li');
                const listItemLink = document.createElement('a');
                listItemLink.setAttribute('href', url);
                const listItemText = document.createTextNode(linkText);
                const listItemSpan = document.createElement('span');
                const listItemUrl = document.createTextNode(url);
                listItemLink.appendChild(listItemText);
                listItem.appendChild(listItemLink);
                listItemSpan.appendChild(listItemUrl);
                listItem.appendChild(listItemSpan);
                list.appendChild(listItem);
              });
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
      const listItem = document.createElement('li');
      const listItemText = document.createTextNode('An error occurred while trying to fetch the data');
      listItem.appendChild(listItemText);
      list.appendChild(listItem);
    }

    document.body.classList.add('loaded');
  }
}

linkValidator();
