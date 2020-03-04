export const getVaneName = code => {
  switch (code) {
    case 'a':
      return 'Ames';
    case 'b':
      return 'Behn';
    case 'c':
      return 'Clay';
    case 'd':
      return 'Dill';
    case 'e':
      return 'Eyre';
    case 'f':
      return 'Ford';
    case 'g':
      return 'Gall';
    case 'i':
      return 'Iris';
    case 'j':
      return 'Jael';
  }
};

export const getVaneNumber = code => 1 + 'abcdefgij'.indexOf(code);
