import React from 'react';

class ImageWithFallback extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      prevSrc: props.src, // Зберігаємо попередній src
    };
  }

  static getDerivedStateFromProps(props, state) {
    // Якщо src змінився, скидаємо стан помилки, щоб спробувати завантажити нове зображення
    if (props.src !== state.prevSrc) {
      return {
        hasError: false,
        prevSrc: props.src,
      };
    }
    return null; // В інших випадках стан не змінюємо
  }

  handleError = () => {
    this.setState({ hasError: true });
  }

  render() {
    const { src, fallbackSrc, ...rest } = this.props;
    const { hasError } = this.state;
    return <img src={hasError ? fallbackSrc : src} onError={this.handleError} {...rest} />;
  }
}

export default ImageWithFallback;