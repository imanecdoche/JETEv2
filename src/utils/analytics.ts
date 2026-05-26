export const exportCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const getKeys = (obj: any, prefix = ''): string[] => {
    return Object.keys(obj).reduce((res: string[], el) => {
      if (Array.isArray(obj[el])) {
        return res; // skip arrays for now or handle as string
      } else if (typeof obj[el] === 'object' && obj[el] !== null) {
        return [...res, ...getKeys(obj[el], prefix + el + '.')];
      }
      return [...res, prefix + el];
    }, []);
  };

  const getValues = (obj: any): any[] => {
    return Object.keys(obj).reduce((res: any[], el) => {
      if (Array.isArray(obj[el])) {
        return res;
      } else if (typeof obj[el] === 'object' && obj[el] !== null) {
        return [...res, ...getValues(obj[el])];
      }
      return [...res, obj[el]];
    }, []);
  };

  const headers = getKeys(data[0]);
  const rows = data.map(item => {
    const values = getValues(item).map(val => {
      if (typeof val === 'string') {
        // escape quotes
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val !== null && val !== undefined ? val : '';
    });
    return values.join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
