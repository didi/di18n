import React from 'react';

export default function Test({ res }) {
  const name = res.data?.user?.name;

  return (
    <div>
      <div>{name}</div>
      <div>标题</div>
    </div>
  );
}
