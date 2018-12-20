const sketch = function(p) {
  let model;
  let dx, dy; // offsets of the pen strokes, in pixels
  let pen_down, pen_up, pen_end; // keep track of whether pen is touching paper
  let x, y; // absolute coordinates on the screen of where the pen is
  let prev_pen = [1, 0, 0]; // group all p0, p1, p2 together
  let rnn_state; // store the hidden states of rnn's neurons
  let pdf; // store all the parameters of a mixture-density distribution
  let temperature = 0.45; // controls the amount of uncertainty of the model
  let line_color;
  let model_loaded = false;
  let screen_width, screen_height;

  const MODEL_LIST = ['bird', 'ant','ambulance','angel','alarm_clock','backpack','barn','basket','bear','bee','bicycle','book','brain','bridge','bulldozer','bus','butterfly','cactus','calendar','castle','cat','chair','couch','crab','cruise_ship','diving_board','dog','dolphin','duck','elephant','eye','face','fan','fire_hydrant','firetruck','flamingo','flower','frog','garden','hand','hedgeberry','hedgehog','helicopter','kangaroo','key','lantern','lighthouse','lion','lobster','map','mermaid','monkey','mosquito','octopus','owl','paintbrush','palm_tree','parrot','passport','peas','penguin','pig','pineapple','pool','postcard','rabbit','radio','rain','rhinoceros','rifle','roller_coaster','sandwich','scorpion','sea_turtle','sheep','skull','snail','snowflake','speedboat','spider','squirrel','steak','stove','strawberry','swan','swing_set','the_mona_lisa','tiger','toothbrush','toothpaste','tractor','trombone','truck','whale','windmill','yoga'];
  const BASE_URL = 'https://storage.googleapis.com/quickdraw-models/sketchRNN/models/';
  
  const random_model = function () {
    model_loaded = false;

    if (model) {
      model.dispose();
    };

    // initialize a random model!
    const random_index = Math.floor(Math.random() * MODEL_LIST.length);
    model = new ms.SketchRNN(`${BASE_URL}${MODEL_LIST[random_index]}.gen.json`); 

    model.initialize().then(() => {
      model.setPixelFactor(4.0); // initialize the scale factor for the model
      model_loaded = true;
      restart();
      console.log(`${MODEL_LIST[random_index]} loaded!`);
    });
  };

  const clear_screen = function() {
    p.background(255, 255, 255, 255);
    p.fill(255, 255, 255, 255);
  };

  const restart = function() {
    clear_screen();

    // initialize pen's states to zero
    [dx, dy, pen_down, pen_up, pen_end] = model.zeroInput(); // the pen's states

    // zero out the rnn's initial states
    rnn_state = model.zeroState();
  };

  p.next = function() {
    clear_screen();
    random_model();
  }

  p.setup = function() {
    screen_width = p.windowWidth; // window.innerWidth
    screen_height = p.windowHeight; // window.innerHeight
    x = screen_width/4.0;
    y = screen_height/4.0;
    p.createCanvas(screen_width / 2 , screen_height * 0.5);
    p.frameRate(60);
    random_model();
    restart();

    line_color = p.color(p.random(64, 224), p.random(64, 224), p.random(64, 224)); // define color of line
  };

  // this is the p5 loop
  p.draw = function() {
    if (!model_loaded) {
      return;
    }

    // see if we have finished drawing
    if (prev_pen[2] == 1) {
      //initialize pen's states to zero.
      [dx, dy, pen_down, pen_up, pen_end] = model.zeroInput(); // the pen's states

      // zero out the rnn's initial states
      rnn_state = model.zeroState();

      x = screen_width / 4.0;
      y = screen_height / 4.0;
      line_color = p.color(p.random(64, 224), p.random(64, 224), p.random(64, 224));
      model_loaded = false;
    };

    // using the previous pen states, and hidden state, get next hidden state
    rnn_state = model.update([dx, dy, pen_down, pen_up, pen_end], rnn_state);

    // get the parameters of the probability distribution (pdf) from hidden state
    pdf = model.getPDF(rnn_state, temperature);

    // sample the next pen's states from our probability distribution
    [dx, dy, pen_down, pen_up, pen_end] = model.sample(pdf);

    // only draw on the paper if the pen is touching the paper
    if (prev_pen[0] == 1) {
      p.stroke(line_color);
      p.strokeWeight(3.0);
      p.line(x, y, x+dx, y+dy); // draw line connecting prev point to current point.
    }

    // update the absolute coordinates from the offsets
    x += dx;
    y += dy;

    // update the previous pen's state to the current one we just sampled
    prev_pen = [pen_down, pen_up, pen_end];
  };
};

document.querySelector('#draw-btn').addEventListener('click', () => {
  console.log('clicked!');
  p5Sketch.next();
});

const p5Sketch = new p5(sketch, 'sketch');
