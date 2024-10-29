import React from 'react';

const Title = ({ text }) => {
    return (
        <div className='d-flex align-items-center p-4 ps-0 pe-3' style={{width: 'min-content', height: 60 }}>
            <h3 className='m-0'>{text}</h3>
        </div>
    );
};

export default Title;